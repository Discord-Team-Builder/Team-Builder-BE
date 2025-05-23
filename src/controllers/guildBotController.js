import GuildBot from "../config/bot";

export const botConnect = async (req, res) => {
  const { guildId } = req.body;

  if (!guildId) {
    return res.status(400).json({ error: "Guild ID is required" });
  }

  try {
    const guildBot = await GuildBot.guilds.fetch(guildId);
    
    // If bot is in the server, this will succeed
    if (!guildBot) {
      return res.status(404).json({ error: "Bot is not in this server" });
    }

    return res.status(200).json({ message: "Bot is connected to the server" });

  } catch (error) {
    if (error.code === 50001 || error.code === 10004) {
      // 50001: Missing access (bot not in guild)
      // 10004: Unknown Guild (invalid ID or not in guild)
      return res.status(404).json({ error: "Bot is not in this server" });
    }

    console.error("Error connecting to bot:", error);
    return res.status(500).json({ error: "Failed to connect to bot" });
  }
};
