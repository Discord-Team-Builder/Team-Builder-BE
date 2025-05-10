import Project from "../models/project.model";
import Team from "../models/team.model";
import { sendTeamInvites } from "./inviteController";


export const createTeam = async (req, res) => {
    const { projectId, teamName, members } = req.body;

    if (!projectId || !teamName || !members) {
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

        await Team.save();
        await Project.findByIdAndUpdate(projectId, {
            $push: { teams: newTeam._id },
        });
        await sendTeamInvites(members, projectId, newTeam._id);
        return res.status(201).json({ message: "Team created successfully", team: newTeam });
    } catch (error) {
        console.error("Error creating team:", error);
        return res.status(500).json({ error: "Failed to create team" });
    }
}