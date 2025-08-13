const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Scrim = require('../model/scrim');
const { getFormatTimestamp } = require('../utils/stringUtils');

/**
 * 
 * @description 스크림 모집글을 위한 Embed를 생성하는 함수
 */

// 코드값 → 뱃지 텍스트 변환
const toBadge = (statusCode) => Scrim.StatusBadge[statusCode] ?? String(statusCode);

const buildScrimEmbed = ({
  title,
  clan,
  players,
  time,
  etc,
  status = Scrim.Status.WAIT, // 기본값: 모집 대기
  author,
  appliedByCount,
}) => {
  const playerLines = players
    .map((p, i) => `${i + 1}. ${p.nick} / ${p.nowTier} / ${p.prevTier}`)
    .join('\n');

  return new EmbedBuilder()
    .setTitle(`${title}`)
    .setColor(0x00BFFF)
    .setDescription(
      `📌 **현재 상태**\n${toBadge(status ?? Scrim.Status.WAITING)}\n\n` +
      `🏷️ **클랜명**: ${clan}\n\n` +
      `${playerLines}\n\n` +
      `⏰ **가능 시간**\n${time}\n\n` +
      `📝 **기타**\n${etc || '없음'}\n\n` + 
      ` **신청자**: ${appliedByCount || 0} 명`
    )
    .setFooter({
      text: `작성자: ${author.displayName}`,
      iconURL: author.displayAvatarURL(),
    });
}

function createButtons(ownerId, isOpen) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`setOpen:${ownerId}`)
      .setLabel('🟢 모집중')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isOpen),   // 모집중이면 비활성화

    new ButtonBuilder()
      .setCustomId(`setClose:${ownerId}`)
      .setLabel('🔴 취소하기')
      .setStyle(ButtonStyle.Danger),
      // .setDisabled(isOpen),  

    new ButtonBuilder()
      .setCustomId(`applyScrim:${ownerId}`)
      .setLabel('🟡 신청하기')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!isOpen)
    
  );
}

/**
 * Embed description 내 '📌 현재 상태' 라인을 새로운 텍스트로 교체
 * @param {Embed} embed - 기존 embed
 * @param {string} newStatusCode - "🟢 모집중"
 * @returns {EmbedBuilder} 수정된 embed
 */
function updateEmbedDesc(embed, newStatusCode) {
  const newEmbed = EmbedBuilder.from(embed);
  const originalDesc = newEmbed.data.description || "";

  // 상태 뱃지로 변환
  const newStatusText = toBadge(newStatusCode);
  const timeStr = getFormatTimestamp();

  const updatedDesc = originalDesc.replace(
    /📌 \*\*현재 상태\*\*\n.+?\n/,
    `📌 **현재 상태**\n${newStatusText}(${timeStr})\n`
  );

  newEmbed.setDescription(updatedDesc);
  return newEmbed;
}

module.exports = { buildScrimEmbed, createButtons, updateEmbedDesc };
