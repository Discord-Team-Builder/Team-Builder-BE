import GuildBot from "../config/bot.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import { ChannelType, PermissionsBitField } from "discord.js";
import ApiError from "./api-error.js";
import { StatusCode } from "../services/constants/statusCode.js";

export const CreateChannel = async ({ guildId, channelName, type = "voice", teamId }) => {
  try {
    const guildBot = await GuildBot.guilds.fetch(guildId);
    if (!guildBot) throw new ApiError(StatusCode.NOT_FOUND, "Guild not found", [], "Please check the guild ID.");

    const project = await Project.findOne({ guildId });
    if (!project) throw new ApiError(StatusCode.NOT_FOUND, "Project not found", [], "Please check the project ID.");

    const team = await Team.findById(teamId).populate("members.user");
    if (!team) throw new ApiError(StatusCode.NOT_FOUND, "Team not found", [], "Please check the team ID.");

    const role = await guildBot.roles.create({
      name: team.name,
      color: "Random",
      mentionable: true,
    }).catch(err => {
      console.error("Role creation failed:", err);
      throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, "Failed to create role", [err.message], err.stack);
    });

    team.discord.roleId = role.id;
    await team.save()

    const allowedDiscordUserIds = team.members
      .map(m => m.user?.discordId)
      .filter(Boolean);

    if (allowedDiscordUserIds.length === 0) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        "No valid Discord user IDs found in team members",
        [],
        "Ensure team members have valid Discord accounts linked."
      );
    }

    // Ensure users are in the guild member cache (important for permissions!)
    const fetchedMembers = await Promise.all(
      allowedDiscordUserIds.map(async discordId => {
        try {
          return await guildBot.members.fetch(discordId);
        } catch {
          return null;
        }
      })
    );

    const validMembers = fetchedMembers.filter(m => m !== null);

    const permissionOverwrites = [
      {
      id: guildBot.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
      {
        id: guildBot.roles.everyone.id,
        type: 0, // 0 for role
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      ...validMembers.map(member => ({
        id: member.user.id, // Now validated and cached
        type: 1, // 1 for member
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

    if (type === "voice") {
      team.discord.voiceChannelId = channel.id;
    } else {
      team.discord.textChannelId = channel.id;
    }

    await team.save();
    return team;

  } catch (err) {
    console.error("Channel creation failed:", err);
    throw new ApiError(
      StatusCode.INTERNAL_SERVER_ERROR,
      "Failed to create channel",
      [err.message],
      err.stack
    );
  }
};
