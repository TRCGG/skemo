const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
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
    .addStringOption(o => o.setName('etc').setDescription('기타 메모').setRequired(false))
    .toJSON(),

  // 기존 모집현황 명령어도 같이 포함
  new SlashCommandBuilder()
    .setName('모집현황')
    .setDescription('현재 모집 중인 유저 목록을 보여줍니다.')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('슬래시 커맨드 등록 중...');

    // await rest.put(
    //   Routes.applicationCommands(process.env.CLIENT_ID),
    //   { body: commands }
    // );

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );

    console.log('슬래시 커맨드 등록 완료!');
  } catch (error) {
    console.error(error);
  }
})();
