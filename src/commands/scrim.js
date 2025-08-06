const { SlashCommandBuilder} = require('discord.js');
const { buildScrimEmbed, createButtons } = require('../utils/scrimButtonEmbed');

/**
 * @description 스크림 모집 명령어
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('스크림등록')
    .setDescription('스크림 등록 글을 생성합니다.')
    .addStringOption(o => o.setName('클랜명').setDescription('소속 클랜명').setRequired(true))
    .addStringOption(o => o.setName('nick1').setDescription('탑_닉네임#태그 1').setRequired(true))
    .addStringOption(o => o.setName('nowtier1').setDescription('탑_현재_티어_1').setRequired(true))
    .addStringOption(o => o.setName('prevtier1').setDescription('탑_이전_최고 티어_1').setRequired(true))
    .addStringOption(o => o.setName('nick2').setDescription('정글_닉네임#태그 2').setRequired(true))
    .addStringOption(o => o.setName('nowtier2').setDescription('정글_현재_티어_2').setRequired(true))
    .addStringOption(o => o.setName('prevtier2').setDescription('정글_이전_최고 티어_2').setRequired(true))
    .addStringOption(o => o.setName('nick3').setDescription('미드_닉네임#태그 3').setRequired(true))
    .addStringOption(o => o.setName('nowtier3').setDescription('미드_현재_티어_3').setRequired(true))
    .addStringOption(o => o.setName('prevtier3').setDescription('미드_이전_최고_티어_3').setRequired(true))
    .addStringOption(o => o.setName('nick4').setDescription('원딜_닉네임#태그 4').setRequired(true))
    .addStringOption(o => o.setName('nowtier4').setDescription('원딜_현재_티어_4').setRequired(true))
    .addStringOption(o => o.setName('prevtier4').setDescription('원딜_이전_최고_티어_4').setRequired(true))
    .addStringOption(o => o.setName('nick5').setDescription('서폿_닉네임#태그5').setRequired(true))
    .addStringOption(o => o.setName('nowtier5').setDescription('서폿_현재_티어_5').setRequired(true))
    .addStringOption(o => o.setName('prevtier5').setDescription('서폿_이전_최고 티어_5').setRequired(true))
    .addStringOption(o => o.setName('time').setDescription('가능 시간대').setRequired(true))
    .addStringOption(o => o.setName('etc').setDescription('피리어스 여부 혹은 기타').setRequired(false)),

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
