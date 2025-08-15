const { EmbedBuilder } = require('discord.js');
const { buildEmojiPlayerLines } = require('../utils/stringUtils');

function buildMatchEmbed(hostScrim, guestScrim) {
  
  const hostLines = buildEmojiPlayerLines(hostScrim.players).split('\n');
  const guestLines = buildEmojiPlayerLines(guestScrim.players).split('\n');

  const mergedLines = hostLines.map((h, i) => `${h} vs ${guestLines[i]}`);

  return new EmbedBuilder()
    .setTitle('⚔️ 스크림 매치')
    .setDescription(
      `${hostScrim.clan} 🆚 ${guestScrim.clan}\n\n` +
      mergedLines.join('\n')
    )
    .setColor(0x00AE86)
    .setFooter({ text: `가능시간대 \n ${hostScrim.time}  ${guestScrim.time}` });
}

module.exports = { buildMatchEmbed };
