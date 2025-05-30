import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { UpdateProfile } from '../controllers/userController.js';
const router = Router();

router.put('/update-profile', authMiddleware, UpdateProfile)


export default router;