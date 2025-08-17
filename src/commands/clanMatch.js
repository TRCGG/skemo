const { SlashCommandBuilder } = require("discord.js");
const ClanMatchController = require('../controllers/clanMatch.controller');

// 컨트롤러 인스턴스 1개만 사용
const clanMatchController = new ClanMatchController();

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
    
    return clanMatchController.handleGetClanMatches(interaction, {
      game_type: gameType,               // 배열 그대로 전달 (client가 join 처리)
      our_clan_name: ourClanName,
      our_clan_role_id: ourClanRoleId,
      // opponent_clan_role_id: 선택 시 여기에 넣기
    });
  },
};
