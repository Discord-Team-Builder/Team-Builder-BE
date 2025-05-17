import Project from "../models/project.model.js";
import Team from "../models/team.model.js";
import { sendTeamInvites } from "./inviteController.js";


export const CreateTeam = async (req, res) => {
    const { projectId, teamName, members } = req.body;

    if (!projectId || !teamName ) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        const isAdmin = project.participants.some(
        (p) =>
            p.user.toString() === req.user._id.toString() && p.role === "admin"
        );

        if (!isAdmin){
            return res.status(403).json({ error: "Only admins can create teams" });
        }
        if (project.teams.length > project.maxTeams) {
            return res.status(400).json({ error: "Maximum number of teams reached" });
        }

        const existingTeam = project.teams.find(team => team.name === teamName);
        if (existingTeam) {
            return res.status(400).json({ error: "Team already exists" });
        }

        const maxTeams = project.maxTeams;
        const maxMembers = project.maxTeamMembers;
        
           // Total members limit check
        const totalAllowedMembers = maxTeams * maxMembers;
        if (emailArray.length > totalAllowedMembers) {
            return res.status(400).json({ error: `Too many members. Maximum allowed: ${totalAllowedMembers}` });
        }

        // Create teams in chunks
        const createdTeams = [];
        const chunks = [];
        for (let i = 0; i < emailArray.length; i += maxMembers) {
            chunks.push(emailArray.slice(i, i + maxMembers));
        }

        for (let i = 0; i < chunks.length && project.teams.length + createdTeams.length < maxTeams; i++) {
            const teamEmails = chunks[i];
            const teamName = `Team ${project.teams.length + createdTeams.length + 1}`;
            const newTeam = new Team({
                name: teamName,
                projectId: project._id,
                members: [],
                discord: {
                    guildId: project.guildId,
                    roleId: "",
                    voiceChannelId: "",
                    textChannelId: "",
                },
            });

            await newTeam.save();
            await Project.findByIdAndUpdate(
                projectId,
                { $push: { teams: newTeam._id } },
                { new: true, useFindAndModify: false }
            );

            await sendTeamInvites(teamEmails, projectId, newTeam._id, req.user._id);
            createdTeams.push({ name: teamName, members: teamEmails });
        }

        return res.status(201).json({
            message: "Teams created and invites sent",
            createdTeams,
        });

    } catch (error) {
        console.error("Error creating team:", error);
        return res.status(500).json({ error: "Failed to create team" });
    }
}