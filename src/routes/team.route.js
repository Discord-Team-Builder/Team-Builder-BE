import { Router } from 'express';
const router = Router();
import { CreateTeam } from '../controllers/teamController.js';
import { acceptTeamInvite } from '../controllers/inviteController.js';
import authMiddleware from '../middleware/authMiddleware.js';


router.post('/create', authMiddleware, CreateTeam); 
router.get("/accept", authMiddleware, acceptTeamInvite);

export default router;