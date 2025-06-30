const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// 명령어 로딩 (예: commands/scrim.js)
const fs = require('fs');
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./src/commands/${file}`);
  client.commands.set(command.data.name, command);
}

// 슬래시 커맨드 처리
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) {
      await command.execute(interaction);
    }
  } else if (interaction.isButton()) {
    const [action] = interaction.customId.split(':');
    if (action === 'confirmScrim') {
      return require('./src/interactions/dmConfirmHandler')(interaction);
    }
    await require('./src/interactions/scrimButton')(interaction);
    // await require('./interactions/dmConfirmHandler')(interaction);
  }
});

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} is online!`);
});

client.login(process.env.TOKEN);
