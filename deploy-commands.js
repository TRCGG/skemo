// "scripts": {
//   "register": "node deploy-commands.js",
// }

// src/registerCommands.js
const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const commands = [];

// /commands 폴더에서 슬래시 명령어 정의 불러오기
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./src/commands/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('📦 슬래시 커맨드 등록 중...');

    // 운영
    // await rest.put(
    //   Routes.applicationCommands(process.env.CLIENT_ID),
    //   { body: commands }
    // );

    // 개발
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ 슬래시 커맨드 등록 완료!');
  } catch (error) {
    console.error('❌ 등록 실패:', error);
  }
})();
