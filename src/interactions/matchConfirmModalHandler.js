// src/interactions/matchConfirmModalHandler.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  Colors,
} = require('discord.js');
const scrimStore = require('../stores/scrimStore');
const { buildMatchEmbed } = require('../utils/scrimMatchEmbed');
const { updateEmbedDesc } = require('../utils/scrimButtonEmbed');
const { removeOpenRoleIfNoOpen } = require('../utils/roleUtils');
const Scrim = require('../model/scrim');
const logger = require('../utils/logger');

const ANNOUNCE_CHANNEL_ID = process.env.CONFIRMED_CH_ID;  // 공지 채널 ID
const MODAL_ID_PREFIX = 'matchConfirmModal';
const MODAL_TIME_INPUT_ID = 'confirm_time';

/**
 * 
 * 스크림 매칭 확정 시간 입력시
 */

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith(MODAL_ID_PREFIX + ':')) return;

  const [, hostScrimId, guestScrimId, sourceMessageId] = interaction.customId.split(':');

  const hostScrim = scrimStore.get(hostScrimId);
  const guestScrim = scrimStore.get(guestScrimId);
  if (!hostScrim || !guestScrim) {
    return interaction.reply({ content: '❌ 스크림 정보를 찾을 수 없습니다.', flags: 64 });
  }

  // 권한: 두 등록자만
  const uid = interaction.user.id;
  if (![hostScrim.ownerId, guestScrim.ownerId].includes(uid)) {
    return interaction.reply({ content: '❌ 확정할 권한이 없습니다.', flags: 64 });
  }

  // 모달 입력값: 확정 시간 (확정 채널에서 사용)
  let confirmTime = (interaction.fields.getTextInputValue(MODAL_TIME_INPUT_ID) || '').trim();
  if (confirmTime.length > 64) confirmTime = confirmTime.slice(0, 64);

  await interaction.deferReply({ flags: 64 });

  // 1) 각 스크림 원본 글을 "매칭되었습니다"로 수정 + 버튼 비활성화
  await Promise.all([
    markScrimPostMatched(interaction.client, hostScrim).catch(() => null),
    markScrimPostMatched(interaction.client, guestScrim).catch(() => null),
  ]);

  // 2) (모달 띄운) 원본 메시지의 버튼 비활성화
  try {
    const msg = await interaction.channel?.messages.fetch(sourceMessageId).catch(() => null);
    if (msg) {
      const disabledRow = msg.components?.length
        ? new ActionRowBuilder().addComponents(
            ...msg.components.flatMap(r => r.components.map(c => ButtonBuilder.from(c).setDisabled(true)))
          )
        : null;

      await msg.edit({
        content: `🎉 매칭이 확정되었습니다.${confirmTime ? `\n🕒 확정 시간: ${confirmTime}` : ''}`,
        components: disabledRow ? [disabledRow] : [],
      });

      logger.info("스크림 확정", {
        title: `${hostScrim.title} vs ${guestScrim.title}`,
        host: `<@${hostScrim.ownerId}>`,
        guest: `<@${guestScrim.ownerId}>`,
        confirmTime,
      });
    }
  } catch (e) {
    console.warn('원본 메시지 비활성화 실패:', e?.message || e);
  }

  // 3) 공지 채널에 확정 글(+취소 버튼) 올리기
  try {
    const guild = interaction.guild ?? await interaction.client.guilds.fetch(hostScrim.guildId).catch(() => null);
    if (guild && ANNOUNCE_CHANNEL_ID) {
      const announceChannel = await guild.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(() => null);
      if (announceChannel && announceChannel.type === ChannelType.GuildText) {
        const vsEmbed = buildMatchEmbed(hostScrim, guestScrim);

        const cancelBtn = new ButtonBuilder()
          // store 를 지웠을 때도 권한 판별 가능하도록 두 등록자 ID를 customId에 넣음
          .setCustomId(`matchCancel:${hostScrim.ownerId}:${guestScrim.ownerId}`)
          .setLabel('취소')
          .setStyle(ButtonStyle.Danger);

        await announceChannel.send({
          content: `✅ **스크림 매칭이 확정되었습니다!**${confirmTime ? `\n🕒 ${confirmTime}` : ''}`,
          embeds: [vsEmbed],
          components: [new ActionRowBuilder().addComponents(cancelBtn)],
        });
      }
    }
  } catch (e) {
    console.warn('확정 공지 실패:', e?.message || e);
  }

  // 3) 두 스크림은 메모리에서 제거 (이후 취소해도 원본 글은 그대로 둠)
  scrimStore.delete(hostScrimId);
  scrimStore.delete(guestScrimId);

  // 4) 확정되면 스크림 등록자들 역할 제거.
  await Promise.all([
    removeOpenRoleIfNoOpen(interaction.client, hostScrim.guildId, hostScrim.ownerId),
    removeOpenRoleIfNoOpen(interaction.client, guestScrim.guildId, guestScrim.ownerId),
  ]);

  // 완료 응답
  await interaction.editReply({ content: '🎉 확정 처리 완료!' });
};

// ─────────────────────────────
// helper: 스크림 원본 글을 "매칭되었습니다"로 갱신 + 버튼 비활성화
// ─────────────────────────────
async function markScrimPostMatched(client, scrim) {
  const guild = await client.guilds.fetch(scrim.guildId);
  const channel = await guild.channels.fetch(scrim.channelId);
  const msg = await channel.messages.fetch(scrim.messageId);

  const origEmbed = msg.embeds?.[0];
  const newEmbed = origEmbed ? updateEmbedDesc(origEmbed, Scrim.Status.CONFIRMED) : null;
  const greenEmbed = newEmbed ? EmbedBuilder.from(newEmbed).setColor(Colors.Green) : null;

  const disabledRows = msg.components?.length
    ? [
        new ActionRowBuilder().addComponents(
          ...msg.components.flatMap((row) =>
            row.components.map((c) => ButtonBuilder.from(c).setDisabled(true))
          )
        ),
      ]
    : [];

  await msg.edit({
    content: msg.content || undefined,
    embeds: greenEmbed ? [greenEmbed] : msg.embeds,
    components: disabledRows,
  });
}
