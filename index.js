const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

const loadCommands = require('./src/loadCommands');
const interactionHandler = require('./src/interactions/core/interactionHandler');
const replayListener = require('./src/listeners/replay');
const logger = require('./src/utils/logger');

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
  logger.setClient(client);
  if (process.env.LOG_CHANNEL_ID) logger.setChannel(process.env.LOG_CHANNEL_ID);
  console.log(`✅ ${client.user.tag} is online!`);
});

// 명령어 로딩
loadCommands(client);

// 인터랙션 처리
client.on('interactionCreate', (interaction) => interactionHandler(interaction, client));
// 메시지 생성 이벤트 리스너 등록
client.on('messageCreate', (message) => replayListener.execute(message));

client.login(process.env.TOKEN);
