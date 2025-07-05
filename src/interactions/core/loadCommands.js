const fs = require('fs');
const path = require('path');

module.exports = function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`⚠️ ${file} is missing "data" or "execute" export.`);
    }
  }

  console.log(`📦 명령어 ${client.commands.size}개 로딩 완료`);
};
