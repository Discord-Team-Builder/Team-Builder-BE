import Project from "../models/project.model.js";
import User from "../models/user.model.js";


export const CreateProject= async (req, res) => {
    const {guildId, projectName, maxTeams, maxMembersPerTeam } = req.body;

    if (!guildId || !projectName || !maxTeams || !maxMembersPerTeam) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingProject = await Project.findOne({ projectName });
        if (existingProject){
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
        })
        
        await newProject.save();
        await User.findByIdAndUpdate(req.user._id, {
            $push: { projects: newProject._id },
        })
        return res.status(201).json({ message: "Project created successfully", project: newProject });
    } catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ error: "Failed to create project" });
    }
}

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ guildId: req.user.guildId });
        return res.status(200).json({ projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).json({ error: "Failed to fetch projects" });
    }
}