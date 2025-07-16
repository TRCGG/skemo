const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { setRecruitment, deleteRecruitment } = require('../data/recruitStore');
const { createButtons, updateRecruitStatus } = require('../utils/scrimButtonEmbed');


/**
 * 
 * @description 스크림 모집 버튼 인터랙션 핸들러
 * @returns 
 */
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, ownerId] = interaction.customId.split(':');
  const message = interaction.message;
  const embed = message.embeds[0];

  if (!embed) {
    await interaction.reply({
      content: '❌ 임베드가 없습니다.',
      ephemeral: true,
    });
    return;
  }

  if ((action === 'setOpen' || action === 'setClose') && interaction.user.id !== ownerId) {
    await interaction.reply({
      content: '❌ 이 버튼은 모집글 작성자만 사용할 수 있습니다.',
      ephemeral: true,
    });
    return;
  }

  if (action === 'setOpen' || action === 'setClose') {
    const isOpen = action === 'setOpen';
    const newStatusText = isOpen ? '🟢 모집중' : '🔴 모집종료';

    const updatedEmbed = updateRecruitStatus(embed, newStatusText);

    const role = interaction.guild.roles.cache.find(r => r.name === '스크림모집중');
    if (role) {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (isOpen) {
        setRecruitment(interaction.user.id, {
          channelId: message.channel.id,
          messageId: message.id,
        });
        await member.roles.add(role);
      } else {
        deleteRecruitment(interaction.user.id);
        await member.roles.remove(role);
      }
    }

    const buttons = createButtons(ownerId, isOpen);

    return interaction.update({
      embeds: [updatedEmbed],
      components: [buttons],
    });
  } else if (action === 'requestScrim') {
    const requesterId = interaction.user.id;

    if (ownerId === requesterId) {
      return interaction.reply({
        content: '자기 글에는 신청할 수 없습니다.',
        ephemeral: true,
      });
    }

    const ownerUser = await interaction.client.users.fetch(ownerId);

    // DM 전송
    try {
      await ownerUser.send({
        content: `📬 <@${requesterId}>님이 스크림 신청을 보냈습니다.`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`confirmScrim:${requesterId}`)
              .setLabel('✅ 대화채널 생성')
              .setStyle(ButtonStyle.Primary)
          ),
        ],
      });
      await interaction.reply({
        content: '📨 신청 요청을 보냈습니다!',
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        content: '⚠️ 상대방에게 DM을 보낼 수 없습니다.',
        ephemeral: true,
      });
    }
  } else {
    await interaction.reply({
      content: '❌ 알 수 없는 동작입니다.',
      ephemeral: true,
    });
  }
};
