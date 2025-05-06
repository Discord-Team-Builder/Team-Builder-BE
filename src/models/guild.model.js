import mongoose from "mongoose";

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  name: String,
  icon: String,
  banner: String,
  owner: Boolean,
  permissions: Number,
  permissions_new: String,
  features: [String],
  createdAt: { type: Date, default: Date.now },
});

const Guild = mongoose.model('Guild', guildSchema);
export default Guild;