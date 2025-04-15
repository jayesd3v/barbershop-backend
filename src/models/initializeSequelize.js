import { env, logger } from '@/utils';

// only import sequelize { sequelize } from '@/models'
// to let sequelize know how many models are there at starting time
import {
    appointmentDetailsModel,
    appointmentsModel,
    sequelize,
    servicesModel,
} from '@/models'; // don't touch this line
import generateData from '@/models/generateData';

const {
    NODE_ENV,
    DB_DIALECT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_DATABASE_NAME,
} = env;

const initializeSequelize = async ({
    alter = false,
    force = false,
    logging = false,
} = {}) => {
    try {
        sequelize.options.logging = logging
            ? (sql, timing) => {
                  logger.info(sql);
              }
            : false;

        await sequelize.authenticate();
        logger.info(
            `Database connection has been established successfully. ${DB_DIALECT}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE_NAME}`,
        );

        if (NODE_ENV === 'prod' && (force || alter)) {
            logger.warn(
                'sequelize force and alter are not allowed in production',
            );
        }

        if (NODE_ENV !== 'prod') {
            await sequelize.sync({
                alter,
                force,
            });
            await generateData();
        }

        appointmentsModel.hasMany(appointmentDetailsModel, {
            foreignKey: 'appointmentId',
            as: 'appointmentDetails',
        });

        appointmentDetailsModel.belongsTo(appointmentsModel, {
            foreignKey: 'appointmentId',
            as: 'appointment',
        });
        appointmentDetailsModel.belongsTo(servicesModel, {
            foreignKey: 'serviceId',
            as: 'service',
        });

        servicesModel.hasMany(appointmentDetailsModel, {
            foreignKey: 'serviceId',
            as: 'appointmentDetails',
        });

        sequelize.options.logging = false;
    } catch (e) {
        logger.error(e);
    }
};

export default initializeSequelize;
