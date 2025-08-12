
const { EmbedBuilder } = require('discord.js');

function buildMatchEmbed(hostScrim, guestScrim) {
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ 스크림 매치`)
    .setDescription(`${hostScrim.clan} 🆚 ${guestScrim.clan}`)
    .setColor(0x00AE86)
    .setTimestamp(new Date());

  // 라인 순서
  const laneNames = ['탑', '정글', '미드', '원딜', '서폿'];

  laneNames.forEach((lane, idx) => {
    const hostPlayer = hostScrim.players[idx];
    const guestPlayer = guestScrim.players[idx];
    embed.addFields({
      name: lane,
      value:
        `**${hostPlayer?.nick || '-'}** (${hostPlayer?.nowTier || '-'})` +
        `\nvs\n` +
        `**${guestPlayer?.nick || '-'}** (${guestPlayer?.nowTier || '-'})`,
      inline: true,
    });
  });

  return embed;
}

module.exports = { buildMatchEmbed };
