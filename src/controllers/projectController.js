import mongoose from "mongoose";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import { sendSlackNotification } from "../utils/slackNotifier.js";


export const CreateProject= async (req, res) => {
    const {guildId, projectName, maxTeams, maxMembersPerTeam } = req.body;

    if (!guildId || !projectName || !maxTeams || !maxMembersPerTeam) {
         sendSlackNotification('Error creating project: All fields are required');
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingProject = await Project.findOne({ projectName });
        if (existingProject){
            sendSlackNotification('Error creating project: Project already exists');
            return res.status(400).json({ error: "Project already exists" });
        }

        const newProject = new Project({
            guildId,
            projectId: `${guildId}-${projectName}`,
            name:projectName,
            maxTeams,
            maxMembersPerTeam,
            teams: [],
            createdBy: req.user._id,
            participants: [
                {
                    user: req.user._id,
                    role: "admin",
                },
            ],
        })
        
        await newProject.save();
        await User.findByIdAndUpdate(req.user._id, {
            $push: { projects: newProject._id },
        })
        await sendSlackNotification(`Project created successfully: ${projectName}`);
        return res.status(201).json({ message: "Project created successfully", project: newProject });
    } catch (error) {
        console.error("Error creating project:", error);
        sendSlackNotification('Error creating project: ' + error.message);
        return res.status(500).json({ error: "Failed to create project" });
    }
}

export const getAllProjects = async (req, res) => {
    try {
        const projects = await User.findById(req.user._id).populate("projects");
        sendSlackNotification('Fetched all projects successfully' + projects.projects);
        return res.status(200).json({ projects: projects.projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        sendSlackNotification('Error fetching projects: ' + error.message);
        return res.status(500).json({ error: "Failed to fetch projects" });
    }
}

export const deleteProject = async (req, res) => {
    const { id } = req.params;
    
    // Validate ID first
    if (!mongoose.Types.ObjectId.isValid(id)) {
        sendSlackNotification('Error deleting project: Invalid project ID format');
        return res.status(400).json({ error: "Invalid project ID format" });
    }

    try {
        // 1. Find project WITHOUT deleting first
        const project = await Project.findById(id);
        
        if (!project) {
            sendSlackNotification('Error deleting project: Project not found');
            return res.status(404).json({ error: "Project not found" });
        }

        // 2. Check authorization using proper ID comparison
        const isAdmin = project.participants.some(p => 
            p.user.toString() === req.user._id.toString() && // Convert both to strings
            p.role === "admin"
        );

        if (!isAdmin) {
            sendSlackNotification('Error deleting project: User not authorized');
            return res.status(403).json({ error: "Authorization required" });
        }

        // 3. Only delete after validation
        await Project.findByIdAndDelete(id);

        // 4. Update user's projects
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { projects: id }
        });
        sendSlackNotification('Project deleted successfully: ' + project.name);
        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        sendSlackNotification('Error deleting project: ' + error.message);
        return res.status(500).json({ error: "Server error" });
    }
};