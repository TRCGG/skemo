// src/interactions/dmConfirm.js
const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
} = require('discord.js');

const { setChannel, hasChannel } = require('../utils/scrimChannelStore');

/**
 * @description DM 채널 생성 및 스크림 요청 확인 버튼 핸들러
 */

module.exports = (interaction) => {
  if (!interaction.isButton()) return;

  const [action, requesterId] = interaction.customId.split(':');
  if (action !== 'confirmScrim') return;

  const guild = interaction.guild;
  const ownerId = interaction.user.id;

  Promise.all([
    guild.members.fetch(requesterId),
    guild.members.fetch(ownerId),
  ])
    .then(([requester, owner]) => {
      const existingChannelId = hasChannel(owner.id, requester.id);
      if (existingChannelId) {
        return interaction.update({
          content: `이미 대화 채널이 있어요: <#${existingChannelId}>`,
          components: [
            new ActionRowBuilder().addComponents(
              ButtonBuilder.from(interaction.component).setDisabled(true)
            ),
          ],
        });
      }

      return guild.channels.create({
        name: `스크림-${owner.user.username}-${requester.user.username}`.toLowerCase(),
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: requester.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: owner.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      }).then((channel) => {
        setChannel(owner.id, requester.id, channel.id);

        // 채널 삭제 예약 (12시간 후)
        setTimeout(() => {
          channel.delete('자동 만료된 스크림 대화 채널')
            .catch(console.error);
        }, 1000 * 60 * 60 * 12); // 12시간

        return interaction.update({
          content: `✅ 대화 채널 생성 완료: <#${channel.id}> 12시간 후 채널은 자동 삭제됩니다.`,
          components: [],
        });
      });
    })
    .catch((err) => {
      console.error('❌ DM 채널 생성 오류:', err);
      interaction.reply({
        content: '❌ 채널 생성 중 오류가 발생했습니다.',
        flags: 64,
      }).catch(console.error);
    });
};
