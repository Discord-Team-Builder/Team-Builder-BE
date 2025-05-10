import crypto from "crypto";
import Invite from "../models/invite.model.js";
import Team from "../models/team.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import sendEmail from "../utils/sendEmail"; //  nodemailer function

// Called from createTeam logic
export const sendTeamInvites = async (emails, projectId, teamId) => {
  const invites = await Promise.all(emails.map(async (email) => {
    const token = crypto.randomBytes(32).toString("hex");

    const invite = new Invite({
      email,
      teamId,
      projectId,
      token,
    });

    await invite.save();

    const inviteLink = `${process.env.FRONTEND_URL}/invite/accept?token=${token}`;

    await sendEmail(email, "Team Invitation", `
      You've been invited to join a team.
      Click here to accept: ${inviteLink}
    `);

    return invite;
  }));

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

    team.members.push(userId);
    await team.save();

    invite.accepted = true;
    await invite.save();

    return res.status(200).json({ message: "Joined the team successfully." });
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ error: "Failed to accept invite." });
  }
};
