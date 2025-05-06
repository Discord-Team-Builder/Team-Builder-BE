import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    projectId: { type: String, required: true, unique: true },
    name: String,
    maxTeams: Number,
    maxMembersPerTeam: Number,
    serverId: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teams: [{ name: String, members: [String] }],
  });

const Project = mongoose.model("Project", projectSchema);
export default Project;