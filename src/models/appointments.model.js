import sequelize from '@/models/sequelize';
import { DataTypes, Sequelize } from 'sequelize';

const appointmentsModel = sequelize.define(
    'appointments',
    {
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        paymentProvider: {
            type: DataTypes.ENUM('STRIPE', 'VENMO'),
            allowNull: true,
        },
        paymentReference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentStatus: {
            type: DataTypes.ENUM('PENDING', 'COMPLETED'),
            allowNull: true,
        },
        holdingId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(
                'HOLDING',
                'PENDING',
                'CONFIRMED',
                'COMPLETED',
                'CANCELED',
            ),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        paranoid: true,
    },
);

export default appointmentsModel;
