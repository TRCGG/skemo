// src/interactions/dmConfirm.js
const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
} = require('discord.js');

const { setChannel, hasChannel, getChannel } = require('../utils/scrimChannelStore');

const PARENT_CATEGORY_ID = process.env.SCRIM_DM_CATEGORY_ID || '1389140189674340462'; // 👉 환경변수로 분리 권장
const AUTO_DELETE_MS = 72 * 60 * 60 * 1000; // 72시간

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, requesterId, guildId] = String(interaction.customId).split(':');
  if (action !== 'confirmScrim') return;

  // DM 메시지의 버튼이므로 guild를 따로 가져와야 함
  let guild;
  try {
    guild = await interaction.client.guilds.fetch(guildId);
  } catch (err) {
    logger?.error?.('guild fetch 실패', { guildId, err: String(err) });
    return interaction.reply({ content: '❌ 서버 정보를 불러올 수 없습니다.', ephemeral: true });
  }

  const ownerId = interaction.user.id;

  // 봇 권한 체크 (채널 생성/권한설정 가능?)
  const me = await guild.members.fetchMe().catch(() => null);
  if (!me) {
    return interaction.reply({ content: '❌ 봇 멤버 정보를 확인할 수 없습니다.', ephemeral: true });
  }
  const needed = [
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.ViewChannel,
  ];
  const hasAll = needed.every((p) => me.permissions.has(p));
  if (!hasAll) {
    return interaction.reply({
      content: '❌ 봇에 채널 생성/보기 권한이 부족합니다. (ManageChannels, ViewChannel)',
      ephemeral: true,
    });
  }

  // 요청자/호스트 멤버 객체 확보
  let requester, owner;
  try {
    [requester, owner] = await Promise.all([
      guild.members.fetch(requesterId),
      guild.members.fetch(ownerId),
    ]);
  } catch (err) {
    logger?.error?.('멤버 fetch 실패', { requesterId, ownerId, err: String(err) });
    return interaction.reply({ content: '❌ 유저 정보를 불러올 수 없습니다.', ephemeral: true });
  }

  // 기존 채널 존재하면 그걸 안내(버튼 비활성화)
  const existingChannelId = hasChannel(owner.id, requester.id);
  if (existingChannelId) {
    const existing = await guild.channels.fetch(existingChannelId).catch(() => null);
    const row = new ActionRowBuilder().addComponents(
      ButtonBuilder.from(interaction.component).setDisabled(true)
    );

    if (existing) {
      return interaction.update({
        content: `이미 대화 채널이 있습니다: <#${existing.id}>`,
        components: [row],
      });
    } else {
      // 맵엔 있으나 채널이 사라진 경우 정리
      logger?.warn?.('채널 매핑은 있으나 실제 채널이 없음. 재생성 진행', {
        ownerId: owner.id, requesterId: requester.id, existingChannelId,
      });
    }
  }

  // 채널 이름 구성 (중복/특수문자 고려)
  const safe = (s) => String(s || '').replace(/[^\p{L}\p{N}\-_]/gu, '').slice(0, 20).toLowerCase();
  const channelName = `스크림-${safe(owner.user.displayName)}-${safe(requester.user.displayName)}`;

  try {
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: PARENT_CATEGORY_ID || undefined, // 없으면 루트
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: requester.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: owner.id,     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: me.id,        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
      ],
      reason: '스크림 대화 채널 생성',
    });

    // 매핑 저장
    setChannel(owner.id, requester.id, channel.id);

    // 자동 삭제 예약(프로세스 재시작 시엔 보장 안 됨 → 나중에 스케줄러로 대체 가능)
    setTimeout(() => {
      channel.delete('자동 만료된 스크림 대화 채널').catch((e) => {
        logger?.warn?.('자동 삭제 실패(무시 가능)', { channelId: channel.id, err: String(e) });
      });
    }, AUTO_DELETE_MS);

    // 채널 안내
    await channel.send('🙌 **72시간 후 채널은 자동 삭제됩니다. 상호 존중하며 대화를 나눠주세요!**');

    // 양쪽 DM 알림(실패 무시)
    requester.send({ content: `📢 <@${owner.id}>님이 스크림 신청을 수락 하셨습니다!: <#${channel.id}>` }).catch(() => {});
    owner.send({ content: `📢 <@${requester.id}>님과의 스크림 채널이 생성되었습니다: <#${channel.id}>` }).catch(() => {});

    // 원 DM 메시지 버튼 비활성화하고 성공 안내
    const row = new ActionRowBuilder().addComponents(
      ButtonBuilder.from(interaction.component).setDisabled(true)
    );
    return interaction.update({
      content: `✅ 대화 채널 생성 완료: <#${channel.id}> (72시간 후 자동 삭제)`,
      components: [row],
    });
  } catch (err) {
    logger?.error?.('채널 생성 실패', { guildId, ownerId, requesterId, err: String(err) });
    // 버튼 비활성화는 유지 (중복 클릭 방지)
    const row = new ActionRowBuilder().addComponents(
      ButtonBuilder.from(interaction.component).setDisabled(true)
    );
    return interaction.update({
      content: '❌ 채널 생성 중 오류가 발생했습니다.',
      components: [row],
    });
  }
};
