import { Router } from 'express';
import { servicesController } from '@/controllers';

// router.use('/examplePath', exampleController);
// router.use(exampleController);

const router = Router();
router.use('/services', servicesController);

export default router;
