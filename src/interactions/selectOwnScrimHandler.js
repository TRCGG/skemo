// src/interactions/selectOwnScrimHandler.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const scrimStore = require('../stores/scrimStore');
const { buildScrimEmbed, createButtons } = require('../utils/scrimButtonEmbed');
const Scrim = require('../model/scrim');

/**
 * @desc 신청할 스크림 선택 select menu handler
 */
module.exports = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const customId = String(interaction.customId);
  if (!customId.startsWith('selectOwnScrim:')) return;

  const [, ownerScrimMsgId, ownerId] = customId.split(':');
  const selectedScrimId = interaction.values?.[0];
  const requesterId = interaction.user.id;

  // 데이터 확보
  const ownerScrim = scrimStore.get(ownerScrimMsgId);
  const applyScrim = scrimStore.get(selectedScrimId);

  if (!ownerScrim || !applyScrim) {
    return interaction.reply({ content: '❌ 유효하지 않은 스크림입니다.', flags: 64 });
  }

  // 본인 글 신청 방지
  if (ownerId === requesterId) {
    return interaction.reply({ content: '❌ 자기 글에는 신청할 수 없습니다.', flags: 64 });
  }

  // 상태/중복/본인신청 체크 + 저장까지 스토어가 처리
  const applyRes = scrimStore.apply(ownerScrimMsgId, requesterId);
  if (!applyRes.ok) {
    const msg =
      applyRes.reason === 'OWNER' ? '호스트는 신청할 수 없습니다.' :
      applyRes.reason === 'STATE' ? '지금은 신청할 수 없는 상태예요.' :
      applyRes.reason === 'DUPLICATE' ? '이미 신청한 스크림입니다.' :
      '신청 처리 중 문제가 발생했어요.';
    return interaction.reply({ content: `❌ ${msg}`, flags: 64 });
  }

  // 호스트 DM 발송
  try {
    const ownerUser = await interaction.client.users.fetch(ownerId);
    const dmEmbed = buildScrimEmbed({
      title: applyScrim.title,
      clan: applyScrim.clan,
      players: applyScrim.players,
      time: applyScrim.time,
      etc: applyScrim.etc,
      status: applyScrim.status,
      author: applyScrim.author,
    });

        // 안전하게 링크/멘션 구성
    const channelMention = applyScrim.channelId ? `<#${applyScrim.channelId}>` : '(채널 정보 없음)';
    const messageLink =
      (applyScrim.guildId && applyScrim.channelId && applyScrim.messageId)
        ? `https://discord.com/channels/${applyScrim.guildId}/${applyScrim.channelId}/${applyScrim.messageId}`
        : null;

    const confirmId = `confirmScrim:${requesterId}:${interaction.guildId}`; 
    await ownerUser.send({
      content:[
        `📬 <@${requesterId}>님이 스크림으로 신청했습니다!`,
        `• 채널: ${channelMention}`,
        messageLink ? `• 🔗 메시지 링크: ${messageLink}` : null,
      ].filter(Boolean).join('\n'),
      embeds: [dmEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel('✅ 대화채널 생성')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });
  } catch (e) {
    return interaction.reply({ content: '⚠️ 상대방에게 DM을 보낼 수 없습니다.', flags: 64 });
  }

  // 원본 모집글 임베드 갱신(신청자 수 반영)
  const updated = scrimStore.get(ownerScrimMsgId);
  const channel = await interaction.client.channels.fetch(ownerScrim.channelId);
  const message = await channel.messages.fetch(ownerScrimMsgId).catch(() => null);

  if (message) {
    const updatedEmbed = buildScrimEmbed({
      title: updated.title,
      clan: updated.clan,
      players: updated.players,
      time: updated.time,
      etc: updated.etc,
      status: updated.status,
      author: { id: updated.ownerId },
      appliedCount: updated.appliedBy?.length || 0,
    });
    const buttons = createButtons(ownerId, updated.status === Scrim.Status.OPEN);
    await message.edit({ embeds: [updatedEmbed], components: [buttons] });
  }

  // 사용자 응답
  return interaction.update({
    content: '📨 신청 요청을 보냈습니다!',
    components: [],
  });
};
