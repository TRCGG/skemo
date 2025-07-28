const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const tempReplayStore = require('../data/tempReplayStore');

// 리플레이 확장자 검사
const isReplayFile = (attachment) => {
  return attachment.name && attachment.name.endsWith('.rofl');
};

const TIMEOUT_MS = 1000 * 60 * 60; // 60분

/**
 * @description 메시지 생성 이벤트 리스너 리플레이 파일 업로드 처리
 */

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const attachment = message.attachments.find(isReplayFile);
    if (!attachment) return;

    // 버튼 전송
    const registerButton = new ButtonBuilder()
      .setCustomId(`registerReplay:${message.id}`)
      .setLabel('📥 리플레이 등록')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(registerButton);

    const botMessage = await message.reply({
      content: '📂 리플레이 파일이 업로드되었습니다. 아래 버튼을 눌러 상대한 클랜을 등록해주세요. ',
      components: [row],
    });

    const fileName = attachment.name.endsWith('.rofl')
      ? attachment.name.slice(0, -5)
      : attachment.name;
    
    const timeout = setTimeout(async () => {
      try {
        const channel = await message.client.channels.fetch(message.channel.id);
        const botMsg = await channel.messages.fetch(botMessage.id);
        await botMsg.delete();
            // ⏰ 시간 초과 안내 메시지
        await channel.send({
          content: `⏰ <@${message.author.id}>님, 60분 동안 등록이 이루어지지 않아 리플레이 등록이 취소되었습니다.`,
        });
      } catch (err) {
        console.warn('자동 삭제 실패:', err.message);
      }
      tempReplayStore.delete(message.author.id);
    }, TIMEOUT_MS);

    // 저장
    tempReplayStore.set(message.author.id, {
      messageId: message.id,
      url: attachment.url,
      name: fileName,
      channelId: message.channel.id,
      botMessageId: botMessage.id,
      timeout,
    });

  },
};