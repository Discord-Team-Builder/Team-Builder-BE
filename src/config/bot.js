import { Client, GatewayIntentBits} from "discord.js";

const GuildBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,],
});

GuildBot.login(process.env.DISCORD_BOT_TOKEN);

GuildBot.once("ready", () => {
  console.log("🤖 Bot is ready");
});

export default GuildBot;