import Controller from '@/controllers/Controller';
import { servicesModel } from '@/models';

const servicesController = new Controller({
    basePath: '/service',
});

servicesController.get('/get', async () => {
    return {
        httpCode: 200,
        data: {
            message: 'Project has been executed successfully',
            success: true,
        },
    };
});

servicesController.get('/all', async () => {
    const services = await servicesModel.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
    });

    return {
        data: services,
    };
});

const servicesRoutes = servicesController.getRouter();

export default servicesRoutes;
