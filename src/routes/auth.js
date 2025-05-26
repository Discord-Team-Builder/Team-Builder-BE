import { Router } from 'express';
const router = Router();
import  {discordAuth, discordCallback, getMe, getUserGuilds, logout }  from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { StatusCode } from '../services/constants/statusCode.js';
import ApiResponse from '../utils/api-response.js';

// Define routes
router.get('/auth/discord', discordAuth);
router.get('/auth/callback', discordCallback);
router.get('/status', authMiddleware, (req, res) => {
  res
  .status(StatusCode.OK)
  .json(new ApiResponse(StatusCode.OK, true, "User is authenticated", { user: req.user, isLoggedIn: true }));
});
router.get('/@me', authMiddleware, getMe);
router.get('/guilds', authMiddleware, getUserGuilds);
// router.get('/logout', logout);
router.post('/auth/logout', logout);

export default router;
