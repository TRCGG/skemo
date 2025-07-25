/**
 * String Utils Module
 */

const getClanRoleName = (interaction, role_id) => {
  const role = interaction.guild.roles.cache.get(role_id);
  if (role) {
    const clanRolename = role.name.replace(/^clan_/, '');
    return clanRolename;
  } else {
    return null;
  }
}

module.exports = {
  getClanRoleName, 
}