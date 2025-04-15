import Controller from '@/controllers/Controller';

/***
 * Everytime you creates a new controller
 * Import it through the index.js file
 * and use it in the routes middleware
 */
const exampleController = new Controller({
    basePath: '/example',
});

exampleController.get('/get', async ({ query, params, headers, session }) => {
    return {
        httpCode: 200,
        data: {
            message: 'Project has been started successfully',
            success: true,
        },
    };
});

exampleController.post(
    '/post',
    async ({ body, query, params, headers, session, rawBody }) => {
        return {
            httpCode: 200,
            data: {
                message: 'Project has been started successfully',
                success: true,
            },
        };
    },
);

const exampleRoutes = exampleController.getRouter();

export default exampleRoutes;
