const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const tempReplayStore = require('../data/tempReplayStore');

// 리플레이 확장자 검사
const isReplayFile = (attachment) => {
  return attachment.name && attachment.name.endsWith('.rofl');
};

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
      flags: 64,
    });

    const fileName = attachment.name.endsWith('.rofl')
      ? attachment.name.slice(0, -5)
      : attachment.name;

    // 저장
    tempReplayStore.set(message.author.id, {
      messageId: message.id,
      url: attachment.url,
      name: fileName,
      channelId: message.channel.id,
      botMessageId: botMessage.id,
    });

  },
};