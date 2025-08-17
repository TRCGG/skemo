// src/interactions/selectClanHandler.js
const tempReplayStore = require('../../stores/tempReplayStore');
const ClanMatchController = require('../../controllers/clanMatch.controller');

const clanMatchController = new ClanMatchController();

/**
 * @description 리플레이 등록을 위한 클랜 선택 핸들러
 */
module.exports = async (interaction) => {
  const customId = interaction.customId;
  if (!customId.startsWith('selectClan:')) return;

  const messageId = customId.split(':')[1];
  const userId = interaction.user.id;

  // ✅ 대기건 조회 (유저 기준 단건)
  const replayInfo = tempReplayStore.get(userId);
  if (!replayInfo) {
    return interaction.reply({
      content: '⚠️ 등록 가능한 리플레이가 없습니다. 시간이 초과되었거나 교체되었습니다.',
      flags: 64,
    });
  }

  // ✅ 업로더/메시지 매칭
  if (replayInfo.messageId !== messageId) {
    return interaction.editReply({
      content: '❌ 이 버튼은 당신이 업로드한 리플레이가 아닙니다.',
      flags: 64,
    });
  }

  const selectedRoleId = interaction.values?.[0];
  if (!selectedRoleId) {
    return interaction.reply({
      content: '❌ 선택된 상대 클랜이 없습니다. 다시 시도해주세요.',
      flags: 64,
    });
  }

  // 내 클랜 role
  const myClanRole = interaction.member.roles.cache.find((role) => role.name.includes('clan_'));
  if (!myClanRole) {
    return interaction.reply({
      content: '⚠️ 본인에게 clan_ 역할이 없습니다.',
      flags: 64,
    });
  }
  const myClanRoleId = myClanRole.id;

  // guildId는 interaction에서 바로 추출
  const guildId = interaction.guild?.id;

  try {
    // 컨트롤러에 모든 도메인 플로우 위임
    await clanMatchController.handleRegisterReplayAndMatch(interaction, {
      replayInfo,
      selectedRoleId,
      myClanRoleId,
      guildId,
    });
  } finally {
    // ✅ 대기건 정리(유저 기준)
    tempReplayStore.delete(userId);
  }
};
