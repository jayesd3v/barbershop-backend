import { Router } from 'express';
import {
    exampleController,
    paymentController,
    scheduleController,
    servicesController,
} from '@/controllers';

// router.use(exampleController);

const router = Router();
router.use(exampleController);
router.use(servicesController);
router.use(scheduleController);
router.use(paymentController);

export default router;
