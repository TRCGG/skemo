/**
 * String Utils Module
 */

/**
 * @param {*} interaction 
 * @param {*} role_id 
 * @description 클랜 역할 이름을 반환합니다.
 * @returns 
 */
const getClanRoleName = (interaction, role_id) => {
  const role = interaction.guild.roles.cache.get(role_id);
  if (role) {
    const clanRolename = role.name.replace(/^clan_/, '');
    return clanRolename;
  } else {
    return 'unknown_clan';
  }
}

/**
 * @description 포맷된 시간 문자열을 반환합니다.
 * @returns {string} 포맷된 시간 문자열 (HH:MM)
 */
const getFormatTimestamp = (timestamp = Date.now()) => {
  const timeStr = new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return timeStr;
}

module.exports = {
  getClanRoleName, 
  getFormatTimestamp,
}