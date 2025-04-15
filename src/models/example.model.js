import sequelize from '@/models/sequelize';
import { DataTypes } from 'sequelize';

const exampleModel = sequelize.define(
    'example',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        paranoid: true,
    },
);

exampleModel.associate = (models) => {
    // Define associations here
    // For example:
    // exampleModel.belongsTo(models.anotherModel, {
    //     foreignKey: 'anotherModelId',
    //     as: 'anotherModel',
    // });
};

export default exampleModel;
