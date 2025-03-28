import { Controller } from '@/controllers';

const servicesController = new Controller();

const servicesRoutes = servicesController.getRouter();

export default servicesRoutes;
