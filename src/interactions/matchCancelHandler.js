// src/interactions/matchCancelHandler.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * 
 * @desc 스크림 확정 취소 버튼 핸들러
 */
module.exports = async (interaction) => {
  const [action, a, b] = String(interaction.customId).split(':');

  // 1) 1차 클릭: 확인창 띄우기
  if (action === 'matchCancel') {
    const ownerA = a;
    const ownerB = b;

    if (![ownerA, ownerB].includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ 취소 권한이 없습니다.', flags: 64 });
    }

    // 공지 메시지 id를 confirm 단계로 넘겨줌
    const announceMessageId = interaction.message.id;
    const yesId = `matchCancelConfirm:${announceMessageId}`;
    const noId  = `cancelAbort`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(yesId).setLabel('예, 취소합니다').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(noId).setLabel('아니오').setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      content: '⚠️ 정말 취소하시겠습니까? 공지는 **취소되었습니다**로 변경됩니다.',
      components: [row],
      flags: 64,
    });
  }

  // 2) 예: 공지 메시지 내용을 "취소되었습니다"로 변경 + 버튼 비활성화
  if (action === 'matchCancelConfirm') {
    const announceMessageId = a;

    try {
      const msg = await interaction.channel.messages.fetch(announceMessageId).catch(() => null);
      if (!msg) {
        return interaction.update({ content: '공지 메시지를 찾을 수 없습니다.', flags: 64 });
      }

      const disabled = new ActionRowBuilder().addComponents(
        ...msg.components.flatMap(row =>
          row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
        )
      );

      await msg.edit({
        content: '🛑 **스크림이 취소되었습니다.**',
        embeds: msg.embeds,        // VS 임베드는 유지
        components: [disabled],    // 취소 버튼 비활성화
      });

      return interaction.update({ content: '취소 처리 완료.', components: [], flags: 64 });
    } catch (e) {
      return interaction.update({ content: '처리 중 오류가 발생했습니다.', flags: 64 });
    }
  }
};
