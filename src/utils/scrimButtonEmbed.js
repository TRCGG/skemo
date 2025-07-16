const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

/**
 * 
 * @description 스크림 모집글을 위한 Embed를 생성하는 함수
 */

function buildScrimEmbed({
  clan,
  players,
  time,
  etc,
  status = '❌ 모집 대기 중',
  author,
}) {
  const playerLines = players
    .map((p, i) => `${i + 1}. ${p.nick} / ${p.nowTier} / ${p.prevTier}`)
    .join('\n');

  return new EmbedBuilder()
    .setTitle('🎯 스크림 모집글')
    .setColor(0x00BFFF)
    .setDescription(
      `📌 **현재 상태**\n${status}\n\n` +
      `🏷️ **클랜명**: ${clan}\n\n` +
      `${playerLines}\n\n` +
      `⏰ **가능 시간**\n${time}\n\n` +
      `📝 **기타**\n${etc || '없음'}`
    )
    .setFooter({
      text: `작성자: ${author.tag}`,
      iconURL: author.displayAvatarURL(),
    });
}

function createButtons(ownerId, isOpen) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`setOpen:${ownerId}`)
      .setLabel('🟢 모집중')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isOpen),    // 모집중이면 비활성화

    new ButtonBuilder()
      .setCustomId(`setClose:${ownerId}`)
      .setLabel('🔴 모집종료')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!isOpen),   // 모집중 아니면 비활성화

    new ButtonBuilder()
      .setCustomId(`requestScrim:${ownerId}`)
      .setLabel('🟡 신청하기')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!isOpen)
  );
}

/**
 * Embed description 내 '📌 현재 상태' 라인을 새로운 텍스트로 교체
 * @param {Embed} embed - 기존 embed
 * @param {string} newStatusText - "🟢 모집중" 또는 "🔴 모집종료"
 * @returns {EmbedBuilder} 수정된 embed
 */
function updateRecruitStatus(embed, newStatusText) {
  const newEmbed = EmbedBuilder.from(embed);
  const originalDesc = newEmbed.data.description || "";

  const updatedDesc = originalDesc.replace(
    /📌 \*\*현재 상태\*\*\n.+?\n/,
    `📌 **현재 상태**\n${newStatusText}\n`
  );

  newEmbed.setDescription(updatedDesc);
  return newEmbed;
}

module.exports = { buildScrimEmbed, createButtons, updateRecruitStatus };
