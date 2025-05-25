import { Client, GatewayIntentBits} from "discord.js";
import ApiError from "../utils/api-error";
import dotenv from 'dotenv'

dotenv.config()

const GuildBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,],
});

const botToken = process.env.DISCORD_BOT_TOKEN;
if (!botToken) {
  throw new ApiError(500, "Discord Bot Token is not set in environment variables.", [], "Please set DISCORD_BOT_TOKEN in your .env file.");
}

GuildBot.login(botToken).catch((error) => {
  throw new ApiError(500, "Failed to login to Discord Bot", [error.message], error.stack);
}); 

GuildBot.once("ready", () => {
  console.log(`🤖 Bot is ready ${GuildBot.user.tag}`);
});

GuildBot.on("error", (error) => {
  throw new ApiError(
    500,
    "Discord Bot Error",
    [error.message],
    error.stack
  );
}
);  

GuildBot.on("guildCreate", (guild) => {
  console.log(`🆕 Bot joined new server: ${guild.name} (ID: ${guild.id})`);
});

export default GuildBot;