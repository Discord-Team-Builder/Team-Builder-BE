import axios from 'axios';
import GuildBot from "../config/bot";
import Project from '../models/project.model';

export const CreateChannel = async (req, res) => {
    const { guildId, channelName, type = "voice" } = req.body;
  
    try {
      const guildBot = await GuildBot.fetch(guildId);
      if (!guildBot) return res.status(404).json({ error: "guildBot not found" });
  
      const project = await Project.findOne({ guildId });
      if (!project) return res.status(404).json({ error: "Project not found" });
      const channel = await guildBot.channels.create({
        name: channelName,
        type: type === "voice" ? 2 : 0, // 2: Voice, 0: Text
      });
  
      return res.json({ success: true, channelId: channel.id });
    } catch (err) {
      console.error("Channel creation failed:", err);
      return res.status(500).json({ error: "Failed to create channel" });
    }
};