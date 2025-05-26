import GuildBot from "../config/bot.js";
import { clientId } from "../config/discord.js";
import { StatusCode } from "../services/constants/statusCode.js";
import ApiResponse from "../utils/api-response.js";

const install_URL= `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=1099804183575&integration_type=0&scope=bot+applications.commands`

export const botConnect = async (req, res) => {
  const { guildId } = req.params;

  if (!guildId) {
    return res
    .status(StatusCode.BAD_REQUEST)
    .json(new ApiResponse(StatusCode.BAD_REQUEST, false, "Guild ID is required"));
  }

  try {
    const guildBot = await GuildBot.guilds.fetch(guildId);
    
    // If bot is in the server, this will succeed
    if (!guildBot) {
      return res
      .status(StatusCode.NOT_FOUND)
      .json(new ApiResponse(StatusCode.NOT_FOUND, false, "Bot is not in this server", {
        installLink: install_URL,
      }));
    }

    return res
    .status(StatusCode.OK)
    .json(new ApiResponse(StatusCode.OK, true, "Bot connected successfully", { guild: guildBot }));

  } catch (error) {
    if (error.code === 50001 || error.code === 10004) {
      // 50001: Missing access (bot not in guild)
      // 10004: Unknown Guild (invalid ID or not in guild)
      return res
      .status(StatusCode.NOT_FOUND)
      .json(new ApiResponse(StatusCode.NOT_FOUND, false, "Bot is not in this server", {
        installLink: install_URL,
      }));
    }

    console.error("Error connecting to bot:", error);
    throw new ApiError(
      StatusCode.INTERNAL_SERVER_ERROR,
      "Failed to connect to bot",
      [error.message],
      error.stack
    );}
};
