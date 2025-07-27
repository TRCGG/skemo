/**
 * String Utils Module
 */

/**
 * @param {*} interaction 
 * @param {*} role_id 
 * @description 클랜 역할 이름을 반환합니다.
 * @returns 
 */
const getClanRoleNameByRoleId = (interaction, role_id) => {
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
 * @returns {string} 포맷된 시간 문자열 (HH:MM) || 포맷된 날짜 문자열 (MM-DD)
 */
const getFormatTimestamp = (timestamp = Date.now(), formatType = "hour") => {
  const d = new Date(timestamp);

  if (formatType === "month") {
    // MM-DD 형식
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  }


  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 
 * @param {*} gameType 
 * @description 게임 타입을 문자열로 변환합니다.
 * @returns 
 */
const getFormatGameType = (gameType) => {
  switch (gameType) {
    case "3":
      return "스크림";
    case "4":
      return "격전";
    case "5":
      return "대회";
    default:
      return "unknown Type";
  }
}

/**
 * 
 * @param {*} gameResult 
 * @description 게임 결과를 문자열로 변환합니다.
 * @returns 
 */
const getFormatGameResult = (gameResult) => {
  switch (gameResult) {
    case "win":
      return ":blue_circle:";
    case "lose":
      return ":red_circle:";
    default:
      return "error";
  }
}

module.exports = {
  getClanRoleNameByRoleId, 
  getFormatTimestamp,
  getFormatGameType,
  getFormatGameResult,
}