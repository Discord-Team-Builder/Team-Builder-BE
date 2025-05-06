import { Router } from 'express';
const router = Router();
import  {discordAuth, discordCallback, getMe, getUserGuilds, logout }  from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Define routes
router.get('/auth/discord', discordAuth);
router.get('/auth/callback', discordCallback);
router.get('/@me', authMiddleware, getMe);
router.get('guilds', authMiddleware, getUserGuilds);
// router.get('/logout', logout);
router.post('/auth/logout', logout);

export default router;
