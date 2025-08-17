// src/interactions/dmConfirm.js
const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { getChannelIdByScrimPair, makePairTag, buildScrimChannelName } = require("../utils/scrimChannelStore");
const scrimStore = require("../stores/scrimStore");
const { buildMatchEmbed } = require("../utils/scrimMatchEmbed");
const PARENT_CATEGORY_ID = process.env.SCRIM_DM_CATEGORY_ID || '1389140189674340462';
const AUTO_DELETE_MS = 72 * 60 * 60 * 1000; // 72시간


/**
 * 
 * @desc 스크림 수락버튼 누를 때
 */
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;
  const [action, hostScrimId, guestScrimId] = interaction.customId.split(":");
  if (action !== "scrimConfirm") return;

  // ACK (3초 타임아웃 방지)
  await interaction.deferUpdate();

  try {
    const hostScrim = scrimStore.get(hostScrimId);
    const guestScrim = scrimStore.get(guestScrimId);
  
    if (!hostScrim || !guestScrim) {
      return interaction.followUp({ content: "❌ 스크림 정보를 찾을 수 없습니다."});
    }
  
    if (interaction.user.id !== hostScrim.ownerId) {
      return interaction.followUp({ content: "❌ 이 요청을 처리할 권한이 없습니다."});
    }
  
    // 길드 fetch
    let guild;
    try {
      guild = await interaction.client.guilds.fetch(hostScrim.guildId);
    } catch (err) {
      console.error("❌ guild fetch 실패:", err);
      return interaction.followUp({ content: "❌ 서버 정보를 불러올 수 없습니다.", flags: 64 });
    }
  
    const channelName = buildScrimChannelName(hostScrim.title, guestScrim.title);
    const existingId = await getChannelIdByScrimPair(guild, hostScrim.messageId, guestScrim.messageId);
  
    // const existingChannelId = hasChannel(hostScrim.ownerId, guestScrim.ownerId);
    if (existingId) {
      return interaction.message.edit({
        content: `이미 대화 채널이 있어요: <#${existingId}>`,
        components: [],
        embeds: []
      });
    }
  
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: makePairTag(hostScrim.messageId, guestScrim.messageId),
      parent: PARENT_CATEGORY_ID, // 카테고리 ID 수정
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: hostScrim.ownerId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: guestScrim.ownerId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });
  
    const guestUser = await interaction.client.users.fetch(guestScrim.ownerId).catch(() => null);
    
    await guestUser.send({
      content: `✅ ${hostScrim.title} 스크림 신청이 수락되었습니다. :<#${channel.id}>`,
    }).catch(() => null);
  
    // 72시간 뒤 삭제 예약
    setTimeout(() => {
      channel.delete("자동 만료된 스크림 대화 채널").catch(console.error);
    }, AUTO_DELETE_MS);
  
    // VS Embed + 확정 버튼
    const vsEmbed = buildMatchEmbed(hostScrim, guestScrim);
    const confirmBtn = new ButtonBuilder()
      .setCustomId(`matchConfirm:${hostScrimId}:${guestScrimId}`)
      .setLabel("✅ 확정하기")
      .setStyle(ButtonStyle.Success);
  
    const row = new ActionRowBuilder().addComponents(confirmBtn);
    const content = [
      '✅ 스크림 채널이 생성되었습니다.',
      '이 채널은 **작성자와 신청자만** 볼 수 있습니다.',
      '약속이 확정되면 **확정** 버튼을 눌러 주세요.',
      '채널은 72시간 후 자동 삭제됩니다.',
    ].join('\n');
  
    await channel.send({
      content:content,
      embeds: [vsEmbed], 
      components: [row] 
    });
  
    await interaction.message.edit({
      content: `✅ 대화 채널 생성 완료: <#${channel.id}> (72시간 후 자동 삭제)`,
      embeds: [],
      components: [],
    });

  } catch (err) {
    // 토큰 만료/중복응답 등 예외 대비
    console.error('dmConfirm error:', err);
    try {
      await interaction.followUp({ content: '❌ 처리 중 오류가 발생했습니다. 다시 시도해 주세요.' });
    } catch (_) {
      // ignore
    }
  }
};

