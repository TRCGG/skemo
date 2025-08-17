const { EmbedBuilder } = require("discord.js");
const stringUtils = require("./stringUtils");

/**
 * @description 클랜 매치 임베드 유틸리티
 */


/**
 * 
 * @param {*} clanData 
 * @param {*} our_clan_name 
 * @description 클랜 매치 데이터를 기반으로 임베드를 생성합니다.
 * @returns 
 */
const getClanMatchEmbed = (clanData, our_clan_name) => {

  const totalGames = clanData.clanMatch.reduce((sum, match) => sum + match.total_count, 0);
  const totalWins = clanData.clanMatch.reduce((sum, match) => sum + match.win, 0);
  const totalLoses = clanData.clanMatch.reduce((sum, match) => sum + match.lose, 0);
  const totalWinRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(2) : 0;

  const topOpponents = clanData.clanMatch.slice(0, 10);
  const recentMatches = clanData.recentClanMatch.slice(0, 10);

  const embed = new EmbedBuilder()
    .setTitle(`${our_clan_name} 클랜 전적`)
    .setColor("Gold")
    .addFields(
      {
        name: "📊 총 전적",
        value: `총 **${totalGames}판** ${totalWins}승 ${totalLoses}패 승률: **${totalWinRate}%**`,
        inline: true,
      },
      {
        name: "🛡️ 상대 클랜 전적 (Top 10)",
        value:
          topOpponents.length > 0
            ? topOpponents
                .map(
                  (o, idx) =>
                    `${idx + 1}. **${o.opponent_clan_name}** - ${o.total_count}판 ${o.win}승 ${
                      o.lose
                    }패`
                )
                .join("\n")
            : "기록된 상대 전적이 없습니다.",
      },
      {
        name: "🕒 최근 전적",
        value:
          recentMatches.length > 0
            ? recentMatches
                .map(
                  (m) => {
                    const timeStr = stringUtils.getFormatTimestamp(m.create_date, "month");
                    const gameType = stringUtils.getFormatGameType(m.game_type);
                    const gameResult = stringUtils.getFormatGameResult(m.game_result);
                    return `\`${timeStr}\` ${gameResult} ${m.opponent_clan_name} (${gameType})`

                  }
                )
                .join("\n")
            : "최근 전적이 없습니다.",
      }
    )
    // .setFooter({ text: "클랜 전적은 clan_match 기준입니다." });
  return embed;
}




module.exports = {
  getClanMatchEmbed
}