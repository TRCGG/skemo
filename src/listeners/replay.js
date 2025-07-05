const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const tempReplayStore = require('../data/tempReplayStore');

// 리플레이 확장자 검사
const isReplayFile = (attachment) => {
  return attachment.name && attachment.name.endsWith('.rofl');
};

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const attachment = message.attachments.find(isReplayFile);
    if (!attachment) return;

    // 저장
    tempReplayStore.set(message.author.id, {
      messageId: message.id,
      url: attachment.url,
      name: attachment.name,
      channelId: message.channel.id,
    });

    // 버튼 전송
    const registerButton = new ButtonBuilder()
      .setCustomId(`registerReplay:${message.id}`)
      .setLabel('📥 리플레이 등록')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(registerButton);

    await message.reply({
      content: '📂 리플레이 파일이 업로드되었습니다. 아래 버튼을 눌러 등록을 계속하세요.',
      components: [row],
      ephemeral: true,
    });
  },
};