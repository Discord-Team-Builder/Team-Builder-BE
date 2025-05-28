import Project from "../models/project.model.js";
import { autoCreateTeams } from "../utils/autoCreateTeams.js";
import multer from 'multer';
import Papa from 'papaparse';
import { StatusCode } from "../services/constants/statusCode.js";
import ApiResponse from "../utils/api-response.js";
import { sendSlackNotification } from "../utils/slackNotifier.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadCSV = upload.single('csvFile');

export const CreateTeam = async (req, res) => {
    const { projectId, teamName, members } = req.body;
    const csvFile = req.file;
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
            return res
            .status(StatusCode.BAD_REQUEST)
            .json(new ApiResponse(StatusCode.BAD_REQUEST, false, "CSV parsing errors", parsedData.errors));
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            emailArray = parsedData.data
            .map(row => row[0])
            .filter(email => email && emailRegex.test(email));

            if (emailArray.length === 0) {
            return res
            .status(StatusCode.BAD_REQUEST)
            .json(new ApiResponse(StatusCode.BAD_REQUEST, false, "CSV file contains no valid email addresses"));
            }
        } catch (error) {
            throw new ApiError(
                StatusCode.BAD_REQUEST,
                "CSV processing failed",
                [error.message],
                error.stack
            );
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
                return res
                .status(StatusCode.BAD_REQUEST)
                .json(new ApiResponse(StatusCode.BAD_REQUEST, false, "Invalid members format", err.message));
            }
        }
        const createdTeams = await autoCreateTeams({
        emailArray,
        project: project,
        invitedByUserId: req.user._id,
        });
        sendSlackNotification('user ' + req.user.username + ' request to create team: team created successfully');
        return res
        .status(StatusCode.CREATED)
        .json(new ApiResponse(StatusCode.CREATED, true, "team created successfully", {
            teams: createdTeams,
        }));
    } catch (error) {
        console.error("Error creating team:", error);
        sendSlackNotification('user ' + req.user.username + ' request to create team: ' + error.message);
        throw new ApiError(
            StatusCode.INTERNAL_SERVER_ERROR,
            "Failed to create team",
            [error.message],
            error.stack
        );
    }
}