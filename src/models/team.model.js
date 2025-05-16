import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, 
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the User model
      role: { type: String, enum: ["admin", "leader", "member"], default: "member" }, // Role within the team
      joinedAt: { type: Date, default: Date.now }, // Date when the user joined the team
      status: { type: String, enum: ["active", "inactive"], default: "active" }, // Status of the user in the team
    },
  ],
  discord: {
    guildId: String,
    roleId: String,
    voiceChannelId: String,
    textChannelId: String,
  },
});

const Team = mongoose.model("Team", teamSchema);
export default Team;