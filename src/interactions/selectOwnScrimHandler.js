// src/interactions/selectOwnScrimHandler.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const scrimStore = require('../stores/scrimStore');
const { buildScrimEmbed, createButtons } = require('../utils/scrimButtonEmbed');

/**
 * @desc 신청자가 자신의 스크림글 중에 선택하여 상대방에게 신청
 * 
 */
module.exports = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const customId = String(interaction.customId);
  if (!customId.startsWith('selectOwnScrim:')) return;

  const [, ownerScrimMsgId, ownerId] = customId.split(':');
  const gusetScrimMsgId = interaction.values?.[0];
  const applicantUserId = interaction.user.id;

  // 데이터 확보
  const ownerScrim = scrimStore.get(ownerScrimMsgId);
  const guestScrim = scrimStore.get(gusetScrimMsgId);

  if (!ownerScrim || !guestScrim) {
    return interaction.reply({ content: '❌ 유효하지 않은 스크림입니다.', flags: 64 });
  }

  // 본인 글 신청 방지
  if (ownerId === applicantUserId) {
    return interaction.reply({ content: '❌ 자기 글에는 신청할 수 없습니다.', flags: 64 });
  }

  // 상태/중복/본인신청 체크 + 저장까지 스토어가 처리
  const applyRes = scrimStore.apply(ownerScrimMsgId, applicantUserId);
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
      title: guestScrim.title,
      clan: guestScrim.clan,
      players: guestScrim.players,
      time: guestScrim.time,
      etc: guestScrim.etc,
      status: guestScrim.status,
      author: guestScrim.author,
    });

        // 안전하게 링크/멘션 구성
    const channelMention = guestScrim.channelId ? `<#${guestScrim.channelId}>` : '(채널 정보 없음)';
    const messageLink =
      (guestScrim.guildId && guestScrim.channelId && guestScrim.messageId)
        ? `https://discord.com/channels/${guestScrim.guildId}/${guestScrim.channelId}/${guestScrim.messageId}`
        : null;

    const confirmId = `scrimConfirm:${ownerScrimMsgId}:${gusetScrimMsgId}`;
    await ownerUser.send({
      content:[
        `📬 <@${applicantUserId}>님이 스크림을 신청했습니다!`,
        `• 채널: ${channelMention}`,
        messageLink ? `• 🔗 ${messageLink}` : null,
      ].filter(Boolean).join('\n'),
      embeds: [dmEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel('✅ 수락 및 대화채널 생성')
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
      author: updated.author,
      appliedCount: updated.getApplicantCount(),
    });
    const buttons = createButtons(ownerId, true);
    await message.edit({ embeds: [updatedEmbed], components: [buttons] });
  }

  // 사용자 응답
  return interaction.update({
    content: '📨 신청 요청을 보냈습니다!',
    components: [],
  });
};
