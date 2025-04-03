import sequelize from '@/models/sequelize';
import { DataTypes } from 'sequelize';

const appointmentsModel = sequelize.define(
    'appointments',
    {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        paymentProvider: {
            type: DataTypes.ENUM('STRIPE_CARD', 'VENMO'),
            allowNull: false,
        },
        paymentReference: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        paymentStatus: {
            type: DataTypes.ENUM('PENDING', 'COMPLETED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED'),
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

appointmentsModel.associate = (models) => {};

export default appointmentsModel;
