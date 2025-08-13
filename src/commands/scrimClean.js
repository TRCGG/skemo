// src/commands/모집정리.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const scrimStore = require('../stores/scrimStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('스크림정리')
    .setDescription('깨진 모집 링크(삭제된 채널/메시지)를 정리합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o =>
      o.setName('대상')
        .setDescription('정리할 대상 범위')
        .addChoices(
          { name: '열린 글만 (기본)', value: 'open' },
          { name: '전체', value: 'all' },
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const scope = interaction.options.getString('대상') ?? 'open';
    let candidates = scope === 'all'
      ? scrimStore.getAll()
      : scrimStore.getOpen();

    let removed = 0;
    let stillValid = 0;

    for (const it of candidates) {
      try {
        let channel = interaction.guild.channels.cache.get(it.channelId)
          ?? await interaction.guild.channels.fetch(it.channelId).catch(() => null);

        if (!channel) {
          scrimStore.delete(it.messageId);
          removed++;
          continue;
        }

        const msg = await channel.messages.fetch(it.messageId).catch(() => null);
        if (!msg) {
          scrimStore.delete(it.messageId);
          removed++;
          continue;
        }

        stillValid++;
      } catch {
        scrimStore.delete(it.messageId);
        removed++;
      }
    }

    return interaction.editReply(
      `🧹 정리 완료\n• 제거됨: ${removed}\n• 유효함: ${stillValid}`
    );
  },
};
