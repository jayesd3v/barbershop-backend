import sequelize from '@/models/sequelize';
import { DataTypes } from 'sequelize';

const configModel = sequelize.define(
    'configs',
    {
        category: {
            type: DataTypes.ENUM('GENERAL', 'SLOT'),
            allowNull: false,
            defaultValue: 'GENERAL',
        },
        type: {
            type: DataTypes.ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON'),
            allowNull: false,
            defaultValue: 'STRING',
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        note: {
            type: sequelize.Sequelize.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    },
    {
        timestamps: true,
        paranoid: true,
    },
);

configModel.associate = (models) => {
    // Define associations here
    // For example:
    // configModel.belongsTo(models.anotherModel, {
    //     foreignKey: 'anotherModelId',
    //     as: 'anotherModel',
    // });
};

export default configModel;
