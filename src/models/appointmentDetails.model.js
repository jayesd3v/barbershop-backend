import sequelize from '@/models/sequelize';
import { DataTypes } from 'sequelize';
import appointmentsModel from '@/models/appointments.model';
import servicesModel from '@/models/services.model';

const appointmentDetailsModel = sequelize.define(
    'appointmentDetails',
    {
        appointmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        quantity: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        paranoid: true,
    },
);

export default appointmentDetailsModel;
