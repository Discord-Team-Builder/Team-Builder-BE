import GuildBot from "../config/bot.js";
import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import { ChannelType, PermissionsBitField  } from "discord.js";
import ApiError from "./api-error.js";
import { StatusCode } from "../services/constants/statusCode.js";

export const CreateChannel = async ({ guildId, channelName, type = "voice", teamId }) => {
  try {
        console.log("CreateChannel called with:", { guildId, channelName, type, teamId });

    const guildBot = await GuildBot.guilds.fetch(guildId);
        console.log("Fetched guildBot:", !!guildBot, guildBot?.id);

        if (!guildBot) throw new ApiError(StatusCode.NOT_FOUND, "Guild not found", [], "Please check the guild ID.");

    const project = await Project.findOne({ guildId });
       console.log("Fetched project:", !!project, project?._id);

       if (!project) throw new ApiError(StatusCode.NOT_FOUND, "Project not found", [], "Please check the project ID.");

    const team = await Team.findById(teamId).populate("members.user");
      console.log("Fetched team:", !!team, team?._id);

      if (!team) throw new ApiError(StatusCode.NOT_FOUND, "Team not found", [], "Please check the team ID.");

    const role = await guildBot.roles.create({
      name: team.name,
      color: "Random",
      mentionable: true,
    }).catch(err => {
      console.error("Role creation failed:", err);
      throw new ApiError(StatusCode.INTERNAL_SERVER_ERROR, "Failed to create role", [err.message], err.stack);
    });
    console.log("Created role:", role?.id);

    team.discord.roleId = role.id;
    await team.save()
    console.log("Saved team with new roleId:", team.discord.roleId);

    const allowedDiscordUserIds = team.members
      .map(m => m.user?.discordId)
      .filter(Boolean);
    console.log("Allowed Discord User IDs:", allowedDiscordUserIds);

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
    console.log("Valid guild members:", validMembers.map(m => m.user.id));

    const permissionOverwrites = [
      {
      id: guildBot.client.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ReadMessageHistory,
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
    console.log("Permission overwrites:", permissionOverwrites);

    const channel = await guildBot.channels.create({
      name: channelName,
      type: type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
      permissionOverwrites,
    });
    console.log("Created channel:", channel.id, channel.type);

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
