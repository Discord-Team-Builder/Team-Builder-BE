import mongoose from "mongoose";

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  name: String,
  icon: String,
  banner: String,
  botConnected: { type: Boolean, default: false },
  owner: Boolean,
  permissions: Number,
  permissions_new: String,
  createdAt: { type: Date, default: Date.now },
});

const Guild = mongoose.model('Guild', guildSchema);
export default Guild;