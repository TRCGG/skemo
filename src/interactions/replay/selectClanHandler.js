const tempReplayStore = require('../../stores/tempReplayStore');
const { getClanRoleNameByRoleId } = require('../../utils/stringUtils');
const clanMatchService = require('../../service/clanMatchService');

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
      flags: 64, // 임베드 숨김
    });
  }

  const selectedRoleId = interaction.values[0];
  if (!selectedRoleId) {
    return interaction.reply({
      content: '❌ 선택된 상대 클랜이 없습니다. 다시 시도해주세요.',
      flags: 64,
    });
  }

  const member = interaction.member;
  const myClanRole = member.roles.cache.find(role => role.name.includes('clan_'));
  const memberClanRoleId = myClanRole.id;
  const guildId = encodeGuildId(interaction.guild.id);

  // replayInfo 의 channelId, botMessageId
  const channel = await interaction.client.channels.fetch(replayInfo.channelId);

  // 응답 연장
  await interaction.deferUpdate();
  // await interaction.deferReply();

  try {
    if (replayInfo?.timeout) clearTimeout(replayInfo.timeout);

    const replayData = {
      fileUrl: replayInfo.url,
      fileName: replayInfo.name,
      createUser: member.displayName,
      game_type: 1, //일반
      guildId: guildId,
    };

    // 리플레이 데이터 등록
    await clanMatchService.insertReplay(replayData);

    const clanMatchData = {
      file_name: replayInfo.name,
      game_type: 3, //스크림
      our_clan_role_id: memberClanRoleId,
      opponent_clan_role_id: selectedRoleId,
    };

    // 클랜 매치 등록
    await clanMatchService.insertClanMatch(clanMatchData);

    const ourClanName = getClanRoleNameByRoleId(interaction, memberClanRoleId);
    const opponentClanName = getClanRoleNameByRoleId(
      interaction,
      selectedRoleId
    );

    // 버튼 안내 메시지 삭제(있으면)
    if (channel && replayInfo.botMessageId) {
      const botMsg = await channel.messages
        .fetch(replayInfo.botMessageId)
        .catch(() => null);
      if (botMsg) await botMsg.delete().catch(() => {});
    }

    // 에페메랄 UI 닫기
    await interaction.deleteReply().catch(() => {});

    // 채널 공지
    if (channel) {
      await channel.send({
        content: `✅ ${member.displayName} 등록완료: ${replayInfo.name}  ${ourClanName}🏆 vs ${opponentClanName}`,
      });
    } 
  } catch (err) {
    console.error("등록 실패:", err);
    await interaction.deleteReply().catch(() => {});
    if (channel) {
      await channel.send({
        content: `❌ ${member.displayName} 님이 등록에 실패했습니다. 다시 리플레이 파일을 등록해주세요.\n이유: ${err.message}`,
      });
    }
  } finally {
    // ✅ 대기건 정리(유저 기준)
    tempReplayStore.delete(userId);
  }
};

/**
 * 
 * @param {*} guild_id 
 * @description 길드 ID를 Base64로 인코딩
 * @returns 
 */
const encodeGuildId = (guild_id) => {
  if (!guild_id) {
    throw new Error("길드 ID가 비어있습니다");
  }

  const encodedId = Buffer.from(guild_id.toString(), 'utf8').toString('base64');
  return encodedId;
}
