import { env, logger } from '@/utils';
import Sequelize from 'sequelize';

const {
    DB_POOL_CREATE_TIMEOUT,
    DB_POOL_IDLE,
    DB_POOL_MAX,
    DB_POOL_MIN,
    DB_DIALECT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_DATABASE_NAME,
} = env;

const sequelize = new Sequelize(
    DB_DATABASE_NAME,
    DB_USER,
    String(DB_PASSWORD),
    {
        host: DB_HOST,
        port: DB_PORT,
        dialect: DB_DIALECT,
        pool: {
            max: parseInt(DB_POOL_MAX),
            min: parseInt(DB_POOL_MIN),
            idle: parseInt(DB_POOL_IDLE),
            acquire: parseInt(DB_POOL_CREATE_TIMEOUT),
        },
    },
);

export const debugSequelize = async (callback) => {
    sequelize.options.logging = (sql, timing) => {
        logger.info(sql);
    };
    await callback();
    sequelize.options.logging = false;
};

export default sequelize;
