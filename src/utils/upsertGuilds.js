import Guild from '../models/guild.model.js';

/**
 * Updates guilds in DB and returns their IDs.
 * @param {Array} guildsData - Array of guild objects from Discord API
 * @returns {Promise<Array>} - Array of Guild Mongo IDs
 */
export async function upsertGuildsAndGetIds(guildsData) {
  const guildIds = [];
  for (const guild of guildsData) {
    const savedGuild = await Guild.findOneAndUpdate(
      { guildId: guild.id },
      {
        name: guild.name,
        icon: guild.icon,
        banner: guild.banner,
        owner: guild.owner,
        permissions: guild.permissions,
        permissions_new: guild.permissions_new,
      },
      { new: true, upsert: true }
    );
    if (savedGuild && savedGuild._id) {
      guildIds.push(savedGuild._id);
    }
  }
  return guildIds;
}