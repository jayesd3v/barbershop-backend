import sequelize from '@/models/sequelize';
import { DataTypes } from 'sequelize';

const servicesModel = sequelize.define(
    'services',
    {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        maxQuantity: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            validate: {
                min: 1,
            },
            defaultValue: 10,
        },
        duration: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    },
    {
        timestamps: true,
        paranoid: true,
    },
);

servicesModel.associate = (models) => {
    // Define associations here
    // For example:
    // servicesModel.belongsTo(models.anotherModel, {
    //     foreignKey: 'anotherModelId',
    //     as: 'anotherModel',
    // });
};

export default servicesModel;
