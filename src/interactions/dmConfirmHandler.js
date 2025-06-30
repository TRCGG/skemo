const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { setChannel, hasChannel } = require('../../utils/scrimChannelStore');

/**
 * 
 * @param {*} interaction 
 * @description 스크림 대화 채널 생성 버튼 인터랙션 핸들러
 * @returns 
 */
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, requesterId] = interaction.customId.split(':');
  if (action !== 'confirmScrim') return;

  const guild = interaction.client.guilds.cache.first(); // 단일 서버 기준
  const requester = await guild.members.fetch(requesterId);
  const owner = await guild.members.fetch(interaction.user.id);

  // ✅ 이미 채널 존재하면 생성하지 않고 안내 + 버튼 비활성화
  if (hasChannel(owner.id, requester.id)) {
    await interaction.update({
      content: `이미 대화 채널이 있어요: <#${hasChannel(owner.id, requester.id)}>`,
      components: [
        new ActionRowBuilder().addComponents(
          ButtonBuilder.from(interaction.component).setDisabled(true)
        )
      ]
    });
    return;
  }

  // ✅ 채널 생성
  const channel = await guild.channels.create({
    name: `스크림-${owner.user.username}-${requester.user.username}`.toLowerCase(),
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: owner.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: requester.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ],
  });

  setChannel(owner.id, requester.id, channel.id);

  await channel.send(`🎮 <@${owner.id}>님과 <@${requester.id}>의 스크림 채널입니다! 자유롭게 대화하세요.`);

  // ✅ 생성 완료 메시지 + 버튼 비활성화
  await interaction.update({
    content: `📨 채널이 생성되었습니다: <#${channel.id}>`,
    components: [
      new ActionRowBuilder().addComponents(
        ButtonBuilder.from(interaction.component).setDisabled(true)
      )
    ]
  });

  // ✅ 12시간 뒤 자동 삭제
  setTimeout(async () => {
    try {
      const ch = await guild.channels.fetch(channel.id);
      if (ch) await ch.delete('자동 만료 (12시간 경과)');
    } catch (e) {
      console.warn('채널 삭제 실패:', e.message);
    }
  }, 12 * 60 * 60 * 1000);
};
