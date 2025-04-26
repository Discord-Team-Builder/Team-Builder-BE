import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: String,
  email: String,
  avatar: String,
});

const User = mongoose.model('User', userSchema);
export default User;


