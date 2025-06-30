// delete-global-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🌐 글로벌 명령어 삭제 중...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('✅ 글로벌 명령어 삭제 완료!');
  } catch (error) {
    console.error('❌ 삭제 실패:', error);
  }
})();
