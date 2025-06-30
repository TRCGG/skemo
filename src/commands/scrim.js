const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildScrimEmbed, createButtons } = require('../utils/scrimButtonEmbed');

/**
 * @description 스크림 모집 명령어
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('스크림모집')
    .setDescription('스크림 모집 글을 생성합니다.')
    .addStringOption(o => o.setName('클랜명').setDescription('소속 클랜명').setRequired(true))
    .addStringOption(o => o.setName('nick1').setDescription('닉네임#태그 1').setRequired(true))
    .addStringOption(o => o.setName('nowtier1').setDescription('현재 티어 1').setRequired(true))
    .addStringOption(o => o.setName('prevtier1').setDescription('이전 티어 1').setRequired(true))
    .addStringOption(o => o.setName('nick2').setDescription('닉네임#태그 2').setRequired(true))
    .addStringOption(o => o.setName('nowtier2').setDescription('현재 티어 2').setRequired(true))
    .addStringOption(o => o.setName('prevtier2').setDescription('이전 티어 2').setRequired(true))
    .addStringOption(o => o.setName('nick3').setDescription('닉네임#태그 3').setRequired(true))
    .addStringOption(o => o.setName('nowtier3').setDescription('현재 티어 3').setRequired(true))
    .addStringOption(o => o.setName('prevtier3').setDescription('이전 티어 3').setRequired(true))
    .addStringOption(o => o.setName('nick4').setDescription('닉네임#태그 4').setRequired(true))
    .addStringOption(o => o.setName('nowtier4').setDescription('현재 티어 4').setRequired(true))
    .addStringOption(o => o.setName('prevtier4').setDescription('이전 티어 4').setRequired(true))
    .addStringOption(o => o.setName('nick5').setDescription('닉네임#태그 5').setRequired(true))
    .addStringOption(o => o.setName('nowtier5').setDescription('현재 티어 5').setRequired(true))
    .addStringOption(o => o.setName('prevtier5').setDescription('이전 티어 5').setRequired(true))
    .addStringOption(o => o.setName('time').setDescription('가능 시간대').setRequired(true))
    .addStringOption(o => o.setName('etc').setDescription('기타 메모').setRequired(false)),

  async execute(interaction) {
    const clan = interaction.options.getString('클랜명');
    const time = interaction.options.getString('time');
    const etc = interaction.options.getString('etc') || '없음';

    const players = [];
    for (let i = 1; i <= 5; i++) {
      const nick = interaction.options.getString(`nick${i}`);
      const nowTier = interaction.options.getString(`nowtier${i}`);
      const prevTier = interaction.options.getString(`prevtier${i}`);

      players.push({
        nick,
        nowTier,
        prevTier,
      });
    }

    const embed = buildScrimEmbed({
      clan,
      players,
      time,
      etc,
      status: '❌ 모집 대기 중',
      author: interaction.user,
    });

    const buttons = createButtons(interaction.user.id, false);

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
    });
  },
};
