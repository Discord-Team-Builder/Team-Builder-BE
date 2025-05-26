import { Router } from "express";
import { botConnect } from "../controllers/guildBotController.js";
const router = Router();

router.post("/:guildId/botConnect", botConnect )

export default router;
