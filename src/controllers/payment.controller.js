import Controller from '@/controllers/Controller';
import {
    appointmentDetailsModel,
    appointmentsModel,
    servicesModel,
} from '@/models';
import { env, logger } from '@/utils';
import { Op, Sequelize } from 'sequelize';
import Stripe from 'stripe';

const stripe = Stripe(env.STRIPE_SECRET_KEY);

const paymentController = new Controller({
    basePath: '/payment',
});

paymentController.post(
    '/create-checkout-session/:holdingId',
    async ({ params, body }) => {
        const { holdingId } = params;
        const {
            firstName,
            lastName,
            phone,
            email,
            location: { address, lat: latitude, lng: longitude },
        } = body;
        const appointment = await appointmentsModel.findOne({
            where: {
                holdingId,
                [Op.and]: [
                    {
                        createdAt: {
                            [Op.gt]: Sequelize.literal(
                                "NOW() - (INTERVAL '10 MINUTE')",
                            ),
                        },
                    },
                    {
                        status: {
                            [Op.in]: ['HOLDING'],
                        },
                    },
                ],
            },
            include: [
                {
                    model: appointmentDetailsModel,
                    as: 'appointmentDetails',
                    include: [
                        {
                            model: servicesModel,
                            as: 'service',
                        },
                    ],
                },
            ],
        });
        if (!appointment) {
            return {
                httpCode: 404,
                data: {
                    success: false,
                    reasonCode: 'APPOINTMENT_NOT_FOUND',
                },
            };
        }

        const amount =
            appointment.appointmentDetails.reduce((acc, item) => {
                return acc + item.quantity * item.service.price;
            }, 0) * 100;

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                appointmentId: appointment.id,
                holdingId,
                firstName,
                lastName,
                phone,
                email,
            },
            receipt_email: email,
        });

        appointmentsModel.update(
            {
                paymentReference: paymentIntent.id,
                paymentStatus: 'PENDING',
                paymentProvider: 'STRIPE',
                firstName,
                lastName,
                phone,
                email,
                address,
                latitude,
                longitude,
            },
            {
                where: {
                    holdingId,
                },
            },
        );

        return {
            httpCode: 200,
            data: {
                success: true,
                clientSecret: paymentIntent.client_secret,
            },
        };
    },
);

paymentController.post('/webhook', async ({ rawBody, headers }) => {
    const endpointSecret = env.STRIPE_WEBHOOK_SECRET;
    let event = rawBody;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                endpointSecret,
            );
        } catch (err) {
            console.log(
                `⚠️  Webhook signature verification failed.`,
                err.message,
            );
            return {
                httpCode: 400,
                data: {
                    success: false,
                    reasonCode: 'INVALID_WEBHOOK_SIGNATURE',
                },
            };
        }
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { id } = paymentIntent;
        await Controller.transaction(async (transaction) => {
            await appointmentsModel.update(
                {
                    paymentStatus: 'COMPLETED',
                    status: 'CONFIRMED',
                },
                {
                    where: {
                        paymentReference: id,
                    },
                    transaction,
                },
            );
        });
        logger.info(
            `PaymentIntent for ${paymentIntent.amount} was successful!`,
        );
    } else {
        // Unexpected event type
        logger.info(`Unhandled event type ${event.type}.`);
    }

    return {
        httpCode: 200,
        data: {
            success: true,
        },
    };
});

const paymentRoutes = paymentController.getRouter();

export default paymentRoutes;
