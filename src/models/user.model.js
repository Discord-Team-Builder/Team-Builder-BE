import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: String,
  globalName: String,
  email: String,
  avatar: String,
  guilds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guild',
    },
  ],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;


