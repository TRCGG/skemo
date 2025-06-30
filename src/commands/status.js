const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const recruitStore = require("../data/recruitStore");

/**
 * @description 현재 모집 중인 유저 목록을 보여주는 명령어
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("모집현황")
    .setDescription("현재 모집 중인 유저 목록을 보여줍니다."),

  async execute(interaction) {
    const size = recruitStore.getSize();
    if (size === 0) {
      await interaction.reply("현재 모집 중인 유저가 없습니다.");
      return;
    }

    const lines = ["📢 현재 모집 중인 유저들"];

    for (const [userId, { channelId, messageId }, ] of recruitStore.getAllRecruitments()) {
      const channel = await interaction.guild.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);
      const timestamp = `<t:${Math.floor(message.createdTimestamp / 1000)}:t>`; // HH:MM 
      const link = `https://discord.com/channels/${interaction.guild.id}/${channelId}/${messageId}`;
      lines.push(`<@${userId}> - [모집글 보기](${link}) 🕒 작성시각: ${timestamp}`);
    }

    await interaction.reply(lines.join("\n"));
  },
};
