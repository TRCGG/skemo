const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const loadCommands = require('./src/interactions/core/loadCommands');
const interactionHandler = require('./src/interactions/core/interactionHandler');
const replayListener = require('./src/listeners/replay');

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

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} is online!`);
});

// 명령어 로딩
loadCommands(client);

// 인터랙션 처리
client.on('interactionCreate', (interaction) => interactionHandler(interaction, client));
client.on('messageCreate', (message) => replayListener.execute(message));

client.login(process.env.TOKEN);
