import Controller from '@/controllers/Controller';
import { appointmentsModel, configsModel, servicesModel } from '@/models';
import { debugSequelize } from '@/models/sequelize';
import { logger } from '@/utils';
import {
    getBusinessDate,
    getBusinessDateTime,
    getDate,
    getDateTime,
} from '@/utils/converter';
import moment from 'moment-timezone';
import { Op } from 'sequelize';

const scheduleController = new Controller({
    basePath: '/schedule',
});

const getAvailableSlots = (matrix, date, duration, slot) => {};

scheduleController.get(
    '/availability',
    async ({ query, params, headers, session }) => {
        const { startDate, endDate, services } = query;
        const startDateObj = getDate(startDate);
        const endDateObj = getDate(endDate);

        // form of services is [serviceId]:[quantity]|[serviceId]:[quantity]|...
        const parsedServices = services.split('|').map((service) => {
            const [id, quantity] = service.split(':');
            return { id: parseInt(id), quantity: parseInt(quantity) };
        });

        const selectedServices = await servicesModel.findAll({
            where: {
                id: parsedServices.map((service) => service.id),
            },
        });

        const duration = selectedServices.reduce((acc, service) => {
            const serviceDuration = service.duration;
            const serviceQuantity = parsedServices.find(
                (s) => s.id === service.id,
            ).quantity;
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
                start: {
                    [Op.between]: [startDateObj, paddedEndDateObj],
                },
            },
        });

        const appointmentsMatrix = appointmentsWithinRange.reduce(
            (acc, appointment) => {
                const { start } = appointment;
                const businessDate = getBusinessDate(start);
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

                const isAvailable = !appointmentsMatrix[businessDate]?.some(
                    (appointment) => {
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
                    },
                );

                if (isAvailable) {
                    acc.push({
                        // start: slotStart.format('YYYY-MM-DD HH:mm:ss'),
                        label: slotStart.format('hh:mm A'),
                        start: slotStart.unix(),
                        end: slotEnd.unix(),
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

scheduleController.post(
    '/post',
    async ({ body, query, params, headers, session }) => {
        return {
            httpCode: 200,
            data: {
                message: 'Project has been started successfully',
                success: true,
            },
        };
    },
);

const scheduleRoutes = scheduleController.getRouter();

export default scheduleRoutes;
