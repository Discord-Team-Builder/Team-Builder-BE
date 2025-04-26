import { Router } from 'express';
const router = Router();
import  {discordCallback, getMe }  from '../controllers/authController.js';

router.get('/auth/callback', discordCallback);
router.get('/me', getMe);

export default router;
