import Controller from '@/controllers/Controller';
import {
    appointmentDetailsModel,
    appointmentsModel,
    configsModel,
    servicesModel,
} from '@/models';
import { env, logger } from '@/utils';
import { compareTimeHash, getHashTime } from '@/utils/generalUtil';
import {
    convertToMomentDate,
    getBusinessDate,
    getBusinessDateTime,
    getDate,
    getDateTime,
} from '@/utils/time';
import moment from 'moment-timezone';
import { Op, Sequelize } from 'sequelize';

const { TIMEZONE = 'America/Los_Angeles' } = env;

const scheduleController = new Controller({
    basePath: '/schedule',
});

const parseQuantity = (services) => {
    // form of services is [serviceId]:[quantity]|[serviceId]:[quantity]|...
    return services.split('|').reduce((acc, service) => {
        const [id, quantity] = service.split(':');
        acc[id] = parseInt(quantity);
        return acc;
    }, {});
};

const getSelectedServices = async (serviceIds) => {
    return await servicesModel.findAll({
        where: {
            id: serviceIds,
        },
    });
};

scheduleController.get(
    '/availability',
    async ({ query, params, headers, session }) => {
        const { startDate, endDate, services } = query;
        const today = moment.tz('America/New_York').startOf('day');
        // get latest date between startDate and today
        let startDateObj = getDate(startDate);
        if (startDateObj.isBefore(today)) {
            startDateObj = today;
        }
        const endDateObj = getDate(endDate);

        const parsedQuantity = parseQuantity(services);
        const selectedServices = await getSelectedServices(
            Object.keys(parsedQuantity).map(Number),
        );

        const duration = selectedServices.reduce((acc, service) => {
            const serviceDuration = service.duration;
            const serviceQuantity = parsedQuantity[service.id];
            return acc + serviceDuration * serviceQuantity;
        }, 0);

        const activeSlots = await configsModel.findAll({
            where: {
                category: 'SLOT',
                value: 'true',
            },
            order: [['id', 'ASC']],
        });

        const slotLabels = activeSlots.map((slot) =>
            slot.key.replace('SLOT_', ''),
        );

        const paddedEndDateObj = getDateTime(endDate, '23:59:59');

        const appointmentsWithinRange = await appointmentsModel.findAll({
            where: {
                [Op.and]: [
                    {
                        start: {
                            [Op.between]: [
                                startDateObj.toDate(),
                                paddedEndDateObj.toDate(),
                            ],
                        },
                    },
                    {
                        [Op.or]: [
                            {
                                status: {
                                    [Op.in]: [
                                        'PENDING',
                                        'CONFIRMED',
                                        'COMPLETED',
                                    ],
                                },
                            },
                            {
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
                        ],
                    },
                ],
            },
        });

        const appointmentsMatrix = appointmentsWithinRange.reduce(
            (acc, appointment) => {
                const { start } = appointment;
                const startObj = convertToMomentDate(start);
                const businessDate = getBusinessDate(startObj);
                if (Array.isArray(acc?.[businessDate])) {
                    acc[businessDate].push(appointment);
                } else {
                    acc[businessDate] = [appointment];
                }
                return acc;
            },
            {},
        );

        const data = {};
        for (
            const iDate = startDateObj.clone();
            iDate <= endDateObj;
            iDate.add(1, 'days')
        ) {
            const businessDate = getBusinessDate(iDate);
            data[businessDate] = slotLabels.reduce((acc, slot) => {
                const slotStart = getDateTime(businessDate, `${slot}:00`);
                const slotEnd = slotStart.clone().add(duration, 'minutes');

                const appointmentsExisted = appointmentsMatrix[
                    businessDate
                ]?.some((appointment) => {
                    const appointmentStart = moment(appointment.start);
                    const appointmentEnd = moment(appointment.end);

                    return (
                        slotStart.isBetween(
                            appointmentStart,
                            appointmentEnd,
                            null,
                            '[]',
                        ) ||
                        slotEnd.isBetween(
                            appointmentStart,
                            appointmentEnd,
                            null,
                            '[]',
                        ) ||
                        (slotStart.isSame(appointmentStart) &&
                            slotEnd.isSame(appointmentEnd))
                    );
                });

                const isAvailable = !appointmentsExisted;

                if (isAvailable) {
                    const start = slotStart.unix();
                    const end = slotEnd.unix();
                    const label = slotStart.format('hh:mm A');
                    const holdingId = getHashTime(start, end);
                    acc.push({
                        holdingId,
                        label,
                        start,
                        end,
                    });
                }

                return acc;
            }, []);
        }

        return {
            httpCode: 200,
            data,
        };
    },
);

scheduleController.get('/holdingInfo/:holdingId', async ({ params }) => {
    const { holdingId } = params;

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
                attributes: [['serviceId', 'id'], 'quantity'],
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
    return {
        httpCode: 200,
        data: {
            success: true,
            holdingStart: moment(appointment.createdAt).unix(),
            appointmentDetails: appointment.appointmentDetails,
        },
    };
});

scheduleController.post('/hold', async ({ body }) => {
    const { start, end, holdingId, services } = body;
    if (!compareTimeHash(holdingId, start, end)) {
        return {
            httpCode: 400,
            data: {
                success: false,
                reasonCode: 'SLOT_ID_MISMATCH',
            },
        };
    }

    const parsedQuantity = parseQuantity(services);
    const selectedServices = await getSelectedServices(
        Object.keys(parsedQuantity).map(Number),
    );

    const duration = selectedServices.reduce((acc, service) => {
        const serviceDuration = service.duration;
        const serviceQuantity = parsedQuantity[service.id];
        return acc + serviceDuration * serviceQuantity;
    }, 0);

    if (duration * 60 !== end - start) {
        return {
            httpCode: 400,
            data: {
                success: false,
                reasonCode: 'DURATION_MISMATCH',
            },
        };
    }

    const startObj = moment.unix(start).tz(TIMEZONE);
    const endObj = moment.unix(end).tz(TIMEZONE);

    const isAppointmentExisted = await appointmentsModel.findOne({
        where: {
            [Op.and]: [
                {
                    start: {
                        [Op.between]: [startObj.toDate(), endObj.toDate()],
                    },
                    end: {
                        [Op.between]: [startObj.toDate(), endObj.toDate()],
                    },
                },
                {
                    [Op.or]: [
                        {
                            status: {
                                [Op.in]: ['PENDING', 'CONFIRMED', 'COMPLETED'],
                            },
                        },
                        {
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
                    ],
                },
            ],
        },
    });

    if (isAppointmentExisted) {
        return {
            httpCode: 500,
            data: {
                success: false,
                reasonCode: 'APPOINTMENT_EXISTED',
            },
        };
    }

    const appointment = await Controller.transaction(async (transaction) => {
        const draftAppointment = await appointmentsModel.create(
            {
                holdingId: holdingId,
                start: startObj.toDate(),
                end: endObj.toDate(),
                status: 'HOLDING',
            },
            {
                transaction,
            },
        );

        logger.logOnDevelopment(
            `Draft appointment created with holdingId: ${draftAppointment.holdingId}`,
        );

        const appointmentDetails = selectedServices.map((service) => ({
            appointmentId: draftAppointment.id,
            serviceId: service.id,
            quantity: parsedQuantity[service.id],
        }));

        await Promise.all(
            appointmentDetails.map((detail) =>
                appointmentDetailsModel.create(detail, {
                    transaction,
                }),
            ),
        );

        logger.logOnDevelopment(
            `Appointment details created for appointmentId (${
                draftAppointment.id
            }):\n${JSON.stringify(appointmentDetails)}`,
        );

        return draftAppointment;
    });

    if (!appointment) {
        return {
            httpCode: 500,
            data: {
                reasonCode: 'CREATE_APPOINTMENT_FAILED',
                success: false,
            },
        };
    }

    return {
        httpCode: 200,
        data: {
            success: true,
            holdingId: appointment.holdingId,
            holdingStart: moment(appointment.createdAt).unix(),
        },
    };
});

const scheduleRoutes = scheduleController.getRouter();

export default scheduleRoutes;
