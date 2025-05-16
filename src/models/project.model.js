import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    projectId: { type: String, required: true, unique: true },
    name: String,
    maxTeams: Number,
    maxMembersPerTeam: Number,
    guildId: String,
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["admin", "member"], default: "member",  required: true },
      }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team"  }],
  }, 
  { timestamps: true });

const Project = mongoose.model("Project", projectSchema);
export default Project;