import GuildBot from "../config/bot";
import Project from '../models/project.model';
import Team from "../models/team.model";
import { ChannelType } from "discord.js";

export const CreateChannel = async ({guildId, channelName, type = "voice", teamId }) => {
    try {
      const guildBot = await GuildBot.guilds.fetch(guildId);

      if (!guildBot) return res.status(404).json({ error: "guildBot not found" });
  
      const project = await Project.findOne({ guildId });
      if (!project) return res.status(404).json({ error: "Project not found" });

        // Fetch team with user populated
    const team = await Team.findById(teamId).populate("members.user");
    if (!team) throw new Error("Team not found");

    const allowedDiscordUserIds = team.members
      .map(m => m.user?.discordId)
      .filter(Boolean);

    if (allowedDiscordUserIds.length === 0) {
      throw new Error("No members with linked Discord accounts.");
    }

     const permissionOverwrites = [
      {
        id: guildBot.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      ...allowedDiscordUserIds.map(discordId => ({
        id: discordId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      })),
    ];

      const channel = await guildBot.channels.create({
        name: channelName,
        type: type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
        permissionOverwrites,
      });

       // Optionally: Save channel ID to team.discord
        if (type === "voice") {
          team.discord.voiceChannelId = channel.id;
        } else {
          team.discord.textChannelId = channel.id;
        }
        await team.save();
  
      return channel;
    } catch (err) {
      console.error("Channel creation failed:", err);
      return res.status(500).json({ error: "Failed to create channel" });
    }
}