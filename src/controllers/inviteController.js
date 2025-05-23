import crypto from "crypto";
import validator from "validator";
import Invite from "../models/invite.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import GuildBot from "../config/bot.js"; // Discord bot instance
import sendEmail from "../services/transporter.js"; //  nodemailer function
import { CreateChannel } from "../utils/createChannel.js";
import { ChannelType } from "discord.js"; // Discord.js types

// Called from createTeam logic

export const sendTeamInvites = async (emails, projectId, teamId, invitedByUserId) => {
  console.log("emails:", emails);
  const invites = [];

  for (let email of emails) {
    if (!validator.isEmail(email)) {
      console.log(`Skipping invalid email: ${email}`);
      continue;
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invite = new Invite({
      email,
      teamId,
      invitedBy: invitedByUserId,
      projectId,
      token,
    });

    await invite.save();

    const populatedInvite = await invite.populate([
      { path: 'teamId', select: 'name' },
      { path: 'projectId', select: 'name' },
      { path: 'invitedBy', select: 'name email' }
    ]);

    const query = new URLSearchParams({
      token,
      team: populatedInvite.teamId.name,
      project: populatedInvite.projectId.name,
      by: populatedInvite.invitedBy.name || populatedInvite.invitedBy.email
    }).toString();

    const inviteLink = `${process.env.FRONTEND_URL}/invite/accept?${query}`;

    const html = `
      You've been invited to join a team:<br><br>
      📌 <strong>Team:</strong> ${populatedInvite.teamId.name}<br>
      📁 <strong>Project:</strong> ${populatedInvite.projectId.name}<br>
      🙋 <strong>Invited By:</strong> ${populatedInvite.invitedBy.name || populatedInvite.invitedBy.email}<br><br>
      👉 <a href="${inviteLink}">Click to accept the invite</a>
    `;

    try {
      await sendEmail(email, "Team Invitation", html);
      console.log(`✅ Email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
    }

    invites.push(invite);

    // 🕐 Wait for 1 second before next email
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return invites;
};



// Called after user logs in and clicks the link
export const acceptTeamInvite = async (req, res) => {
  const { token } = req.query;
  const userEmail = req.user.email;
  const userId = req.user._id;

  try {
    const invite = await Invite.findOne({ token });

    if (!invite) {
      return res.status(400).json({ error: "Invalid or expired invite." });
    }

    if (invite.accepted) {
      return res.status(400).json({ error: "Invite already used." });
    }

    if (invite.email !== userEmail) {
      return res.status(403).json({ error: "This invite is not for your account." });
    }

    const team = await Team.findById(invite.teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found." });
    }

    // Check if someone already used this email to join
    const alreadyMember = team.members.includes(userId);
    if (alreadyMember) {
      return res.status(400).json({ error: "You are already part of the team." });
    }

    team.members.push({
      user: userId,
    });
    await team.save();

    invite.accepted = true;
    await invite.save();

    // Create channel
   if (!team?.discord?.voiceChannelId || !team?.discord.textChannelId) {
  const updatedTeam = await CreateChannel({
    guildId: team.discord.guildId,
    channelName: team.name,
    type: "voice",
    teamId: team._id,
  });

  if (!updatedTeam?.discord?.voiceChannelId) {
    return res.status(500).json({ error: "Failed to create voice channel" });
  }

  team.discord.voiceChannelId = updatedTeam.discord.voiceChannelId;
  await team.save();
}

    // Assign user to the channel
    const guildBot = await GuildBot.guilds.fetch(team.discord.guildId);
    if (!guildBot) {
      return res.status(404).json({ error: "Guild not found." });
    }
    
    const userGuildId = await User.findOne({ email: invite.email });
    const member = await guildBot.members.fetch(userGuildId.discordId);
    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }
    const channel = await guildBot.channels.fetch(team.discord.voiceChannelId);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found." });
    }
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      console.error("Channel is not a voice channel:", channel?.type);
      return res.status(400).json({ error: "Assigned channel is not a voice channel." });
    }

    // await member.voice.setChannel(channel);
    // console.log(`User ${userId} assigned to channel ${channel.id}`);
    // Assign role to the user
    const serverroleid = team.discord.roleId;
    console.log("serverroleid:", serverroleid);
    const role = await guildBot.roles.fetch(serverroleid);
    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }
    console.log("role:", role);
    await member.roles.add(role);
    console.log(`Role ${role.id} assigned to user ${userId}`);
    // Send a message to the voice channel
    await channel.send(`Welcome to the team, ${member}!`);
    console.log(`Message sent to voice channel ${channel.id}`);
    // Send a message to the user
    await member.send(`Welcome to the team, ${member}!`);
    console.log(`Message sent to user ${member.id}`);
    // Send a message to the project owner
    const projectOwner = await User.findById(invite.invitedBy);
    if (!projectOwner) {
      return res.status(404).json({ error: "Project owner not found." });
    }
    await projectOwner.send(`User ${member} has joined the team ${team.name}.`);
    console.log(`Message sent to project owner ${projectOwner.id}`);
    
    return res.status(200).json({ message: "Joined the team successfully." });
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ error: "Failed to accept invite." });
  }
};
