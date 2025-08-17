// src/commands/클랜전적삭제.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ClanMatchController = require('../controllers/clanMatch.controller');


const clanMatchController = new ClanMatchController();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('클랜전적삭제')
    .setDescription('game_id로 클랜 매치(전적)를 삭제합니다.')
    .addStringOption(o =>
      o.setName('game_id')
        .setDescription('삭제할 매치의 game_id')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // 기본 권한 제한

  async execute(interaction) {
    const gameId = interaction.options.getString('game_id', true);
    const guildId = interaction.guild.id;

    return clanMatchController.handleDeleteClanMatch(interaction, { game_id: gameId, guild_id: guildId });
  },
};
