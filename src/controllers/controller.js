import { env, logger } from '@/utils';
import { Router } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

const METHOD_TYPES = ['get', 'post', 'put', 'delete'];

const DEFAULT_OPTIONS = {
    authenticated: false,
    roles: [],
    validator: null,
};

const processRequest = async (result, req, res, next) => {
    const { httpCode = 200, data } = result || {};

    const processes = [
        {
            execute: async () => {
                // handle successful response
                logger.logOnDevelopment(
                    `Response: ${httpCode}\n${JSON.stringify(data, null, 2)}`,
                );
                res.status(httpCode).send(data);
                return next();
            },
            condition: httpCode === 200 && data,
        },
        {
            execute: async () => {
                // handle failed response
                logger.errorOnDevelopment(
                    `Response: ${httpCode}\n${JSON.stringify(data, null, 2)}`,
                );
                res.status(httpCode).send(
                    data || {
                        success: false,
                        httpCode,
                    },
                );
                return next();
            },
            condition: httpCode !== 200,
        },
        {
            execute: async () => {
                logger.warn('Invalid response data');
                return next();
            },
            condition: true,
        },
    ];

    return await processes.find((process) => process.condition)?.execute();
};

class Controller {
    router;
    basePath;

    constructor({ basePath }) {
        this.router = Router();
        this.basePath = basePath;
    }

    static badRequest(message) {
        if (message) {
            logger.error(message);
        }
        return {
            httpCode: 400,
        };
    }

    static notFound(message) {
        if (message) {
            logger.error(message);
        }
        return {
            httpCode: 404,
        };
    }

    static internalServerError(message) {
        if (message) {
            logger.error(message);
        }
        return {
            httpCode: 500,
        };
    }

    static unauthorized(message) {
        if (message) {
            logger.error(message);
        }
        return {
            httpCode: 401,
        };
    }

    static success(message) {
        if (message) {
            logger.logOnDevelopment(message);
        }
        return {
            httpCode: 200,
            data: {
                success: true,
            },
        };
    }

    static async transaction(callback) {
        const transaction = await sequelize.transaction();
        try {
            await callback(transaction);
            await transaction.commit();
            return true;
        } catch (err) {
            logger.error(err);
            await transaction.rollback();
            return false;
        }
    }

    map(method, path, callback, options = {}) {
        const methodType = method.toLowerCase();
        if (!METHOD_TYPES.includes(methodType)) {
            throw new Error(`Invalid method type: ${methodType}`);
        }

        const combinedOptions = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        const execute = async (req, res, next) => {
            logger.logOnDevelopment(
                `${methodType.toUpperCase()}: ${this.basePath}${path}`,
            );

            if (combinedOptions.validator) {
                const validatingResult = validationResult(req);
                if (!validatingResult.isEmpty()) {
                    logger.error(JSON.stringify(validatingResult.array()));
                    return next(new Error('HTTP_BAD_REQUEST'));
                }
            }

            // parse user request data and pass it into the callback later
            const headers = req.headers;
            const session = req.session;
            const query = req.query;
            const body = req.body;
            const params = req.params;
            let user = null;

            if (combinedOptions.authenticated) {
                if (
                    !headers?.authorization ||
                    !headers?.authorization?.startsWith('Bearer')
                ) {
                    return next(new Error('HTTP_UNAUTHORIZED'));
                }

                const token = headers.authorization.split(' ')[1];
                if (!token) {
                    return next(new Error('HTTP_UNAUTHORIZED'));
                }

                // some Errors can be threw on this
                // JsonWebTokenError, TokenExpiredError, NotBeforeError
                const { email: decodedEmail = '' } = jwt.verify(
                    token,
                    env.JWT_SECRET,
                );

                user = await UserModel.findOne({
                    where: { email: decodedEmail },
                });

                if (!user) {
                    return next(new Error('HTTP_UNAUTHORIZED'));
                }

                session.authenticatedUser = user;

                if (combinedOptions.roles.length) {
                    // for specific roles only
                    const userRoles = session?.authenticatedUser?.roles || [];
                    const hasRole = combinedOptions.roles.some((role) =>
                        userRoles.includes(role),
                    );

                    if (!hasRole) {
                        return next(new Error('HTTP_FORBIDDEN'));
                    }
                }
            }

            try {
                const result = await callback({
                    params,
                    session,
                    query,
                    headers,
                    body,
                    data: {
                        // SHOULD BE USED FOR DEBUGGING ONLY
                        ...req?.params,
                        ...req?.query,
                        ...req?.body,
                    },
                    res,
                    req,
                    next,
                    user,
                });
                return processRequest(result, req, res, next);
            } catch (err) {
                next(err);
            }
        };

        if (combinedOptions.validator) {
            this.router?.[methodType](path, combinedOptions.validator, execute);
        } else {
            this.router?.[methodType](path, execute);
        }
    }

    get(path, callback, options = {}) {
        this.map('get', path, callback, options);
    }

    post(path, callback, options = {}) {
        this.map('post', path, callback, options);
    }

    getRouter() {
        return Router().use(this.basePath, this.router);
    }
}

export default Controller;
