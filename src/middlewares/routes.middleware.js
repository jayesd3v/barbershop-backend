import { Router } from 'express';
import {
    exampleController,
    scheduleController,
    servicesController,
} from '@/controllers';

// router.use(exampleController);

const router = Router();
router.use(exampleController);
router.use(servicesController);
router.use(scheduleController);

export default router;
