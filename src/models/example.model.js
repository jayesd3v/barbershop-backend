import sequelize from '@/models/sequelize';

const exampleModel = sequelize.define(
    'example',
    {
        id: {
            type: sequelize.Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: sequelize.Sequelize.STRING,
            allowNull: false,
        },
        description: {
            type: sequelize.Sequelize.TEXT,
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
