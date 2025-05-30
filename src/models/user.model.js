import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  discordAccessToken: String,
  discordRefreshToken: String,
  username: String,
  globalName: String,
  email: String,
  avatar: String,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  guilds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guild' }],
  bio: String,
  skills: [String],
  github:  String,
  hashnode:  String,
  pearlist: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;


