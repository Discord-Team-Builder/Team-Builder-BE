import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  token: { type: String, required: true },
  accepted: { type: Boolean, default: false },
  expireAt: { type: Date, default: Date.now, expires: '1d' }, 
  
}, { timestamps: true });

const Invite = mongoose.model("Invite", inviteSchema);
export default Invite;
