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
    const clanRolename = role.name.replace(/^clan_/, "");
    return clanRolename;
  } else {
    return "unknown_clan";
  }
};

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
};

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
};

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
};

/**
 * 플레이어 정보를 포맷하여 문자열로 반환
 * @param {*} p
 * @returns
 */
function formatPlayerLine(p) {
  if (!p) return `- / - / -`;
  const nick = p.nick || "-";
  const nowTier = p.nowTier || "-";
  const prevTier = p.prevTier || "-";
  return `${nick} / ${nowTier} / ${prevTier}`;
}

/**
 * 플레이어 목록을 이모지 붙여서 라인별로 출력
 * @param {Array} players - 플레이어 배열
 */
function buildEmojiPlayerLines(players) {
  const laneEmojis = [
    { emoji: "<:pg_top:1405574084368138260>", idx: 0 },
    { emoji: "<:pg_jug:1405574176156287078>", idx: 1 },
    { emoji: "<:pg_mid:1405574178303901847>", idx: 2 },
    { emoji: "<:pg_adc:1405574174105272403>", idx: 3 },
    { emoji: "<:pg_sup:1405574181084598312>", idx: 4 },
  ];
  return laneEmojis
    .map(({ emoji, idx }) => `${emoji} ${formatPlayerLine(players[idx])}`)
    .join("\n");
}

function encodeGuildId(guild_id) {
  if (!guild_id) throw new Error('길드 ID가 비어있습니다');
  return Buffer.from(guild_id.toString(), 'utf8').toString('base64');
};


module.exports = {
  getClanRoleNameByRoleId,
  getFormatTimestamp,
  getFormatGameType,
  getFormatGameResult,
  buildEmojiPlayerLines,
  encodeGuildId,
};
