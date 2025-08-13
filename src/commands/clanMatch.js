const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const clanMatchService = require("../service/clanMatchService");

/**
 * @description 클랜 매치 검색 명령어
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("클랜전적")
    .setDescription("클랜 매치 데이터를 검색합니다.")
    ,
  async execute(interaction) {
    const gameType = [3,4,5];  // 게임 타입: 3 - 스크림, 4 - 격전, 5 - 대회

    // ✅ our_clan_role_id 자동 추출
    const ourClanRole = interaction.member.roles.cache.find((role) =>
      role.name.startsWith("clan_")
    );
    if (!ourClanRole) {
      return interaction.reply({
        content: "⚠️ 본인에게 clan_ 역할이 없습니다.",
        flags: 64,
      });
    }

    const ourClanRoleId = ourClanRole.id;
    const ourClanName = ourClanRole.name.replace(/^clan_/, '');
    const results = await clanMatchService.getClanMatches(
      gameType,
      ourClanName,
      ourClanRoleId,
      // opponent_clan_role_id
    );

    await interaction.reply({
      embeds: [results],
    });
  },
};
