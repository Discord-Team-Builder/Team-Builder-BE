import mongoose from "mongoose";
import multer from 'multer';
import Papa from 'papaparse';
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import { sendSlackNotification } from "../utils/slackNotifier.js";
import { sendTeamInvites } from "./inviteController.js";
import { autoCreateTeams } from "../utils/autoCreateTeams.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadCSV = upload.single('csvFile');

export const CreateProject= async (req, res) => {
    const {guildId, projectName, maxTeams, maxMembersPerTeam, members } = req.body;
       const csvFile = req.file;
    if (!guildId || !projectName || !maxTeams || !maxMembersPerTeam) {
         sendSlackNotification('user ' + req.user.username + ' request to create project: All fields are required');
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingProject = await Project.findOne({ projectName });
        if (existingProject){
            sendSlackNotification('user ' + req.user.username + ' request to create project: Project already exists');
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
        let emailArray = [];
        // Handle CSV file upload
        if (csvFile) {
        try {
            const csvString = csvFile.buffer.toString('utf8');
            const parsedData = Papa.parse(csvString, {
            header: false,
            skipEmptyLines: true,
            transform: (value) => value.trim()
            });

            if (parsedData.errors.length > 0) {
            return res.status(400).json({
                error: "CSV parsing errors",
                details: parsedData.errors
            });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            emailArray = parsedData.data
            .map(row => row[0])
            .filter(email => email && emailRegex.test(email));

            if (emailArray.length === 0) {
            return res.status(400).json({
                error: "CSV file contains no valid email addresses"
            });
            }
        } catch (error) {
            return res.status(400).json({
            error: "CSV processing failed",
            details: error.message
            });
        }
        }
        // Handle text input fallback
        else if (members) {
            try {
                emailArray = JSON.parse(members);
                if (!Array.isArray(emailArray)) {
                    emailArray = [emailArray];
                }
            } catch (err) {
                return res.status(400).json({ error: "Invalid members format. Must be a JSON array." });
            }
        }
        const createdTeams = await autoCreateTeams({
        emailArray,
        project: newProject,
        invitedByUserId: req.user._id,
        });
        await User.findByIdAndUpdate(req.user._id, {
            $push: { projects: newProject._id },
        })
        sendSlackNotification('user ' + req.user.username + ' request to create project: Project created successfully');
        return res.status(201).json({ message: "Project created successfully", project: newProject, teams: createdTeams });
    } catch (error) {
        console.error("Error creating project:", error);
        sendSlackNotification('user ' + req.user.username + ' request to create project: ' + error.message);
        return res.status(500).json({ error: "Failed to create project" });
    }
}

export const getAllProjects = async (req, res) => {
    try {
       const projects = await User.findById(req.user._id)
            .populate({
                path: "projects",
                populate: {
                    path: "teams",
                    populate: {
                        path: "members.user",
                        model: "User", 
                        select: "username globalName avatar email discordId" 
                    }
                }
            });
        sendSlackNotification(`user ${req.user.username} request to fetched all projects`);
        return res.status(200).json({ projects: projects.projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        sendSlackNotification('user ' + req.user.username + ' request to fetch all projects: ' + error.message);
        return res.status(500).json({ error: "Failed to fetch projects" });
    }
}

export const deleteProject = async (req, res) => {
    const { id } = req.params;
    
    // Validate ID first
    if (!mongoose.Types.ObjectId.isValid(id)) {
        sendSlackNotification('user ' + req.user.username + ' request to delete project: Invalid project ID format');
        return res.status(400).json({ error: "Invalid project ID format" });
    }

    try {
        // 1. Find project WITHOUT deleting first
        const project = await Project.findById(id);
        
        if (!project) {
            sendSlackNotification('user ' + req.user.username + ' request to delete project: Project not found');
            return res.status(404).json({ error: "Project not found" });
        }

        // 2. Check authorization using proper ID comparison
        const isAdmin = project.participants.some(p => 
            p.user.toString() === req.user._id.toString() && // Convert both to strings
            p.role === "admin"
        );

        if (!isAdmin) {
            sendSlackNotification('user ' + req.user.username + ' request to delete project: Only admins can delete the project');
            return res.status(403).json({ error: "Authorization required" });
        }

        // 3. Only delete after validation
        await Project.findByIdAndDelete(id);

        // 4. Update user's projects
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { projects: id }
        });
        sendSlackNotification('user ' + req.user.username + ' request to delete project: Project deleted successfully');
        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        sendSlackNotification('user ' + req.user.username + ' request to delete project: ' + error.message);
        return res.status(500).json({ error: "Server error" });
    }
};