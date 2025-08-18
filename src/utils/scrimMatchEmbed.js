const { EmbedBuilder } = require('discord.js');

const laneEmojis = [
  { emoji: "<:pg_top:1405574084368138260>", idx: 0 },
  { emoji: "<:pg_jug:1405574176156287078>", idx: 1 },
  { emoji: "<:pg_mid:1405574178303901847>", idx: 2 },
  { emoji: "<:pg_adc:1405574174105272403>", idx: 3 },
  { emoji: "<:pg_sup:1405574181084598312>", idx: 4 },
];

function buildMatchEmbed(hostScrim, guestScrim) {
  
  const mergedLines = laneEmojis
    .map(({ emoji, idx }) => {
      const hostNick = hostScrim.players?.[idx]?.nick || "-";
      const guestNick = guestScrim.players?.[idx]?.nick || "-";
      return `${emoji} ${hostNick} vs ${guestNick}`;
    })
    .join("\n");

  return new EmbedBuilder()
    .setTitle('⚔️ 스크림 매치')
    .setDescription(
      `${hostScrim.clan} 🆚 ${guestScrim.clan}\n\n` +
      mergedLines
    )
    .setColor(0x00AE86)
    .setFooter({ text: `가능시간대 \n${hostScrim.time} / ${guestScrim.time}` });
}

module.exports = { buildMatchEmbed };
