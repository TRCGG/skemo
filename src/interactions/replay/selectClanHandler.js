const tempReplayStore = require('../../data/tempReplayStore');
const httpClient = require('../../utils/clientUtils');
const { getClanRoleName } = require('../../utils/stringUtils');

/**
 * @description 리플레이 등록을 위한 클랜 선택 핸들러
 */

module.exports = async (interaction) => {
  const customId = interaction.customId;
  if (!customId.startsWith('selectClan:')) return;

  const messageId = customId.split(':')[1];
  const userId = interaction.user.id;

  const member = interaction.member;
  const memberClanRoleId = member.roles.cache.find(role => role.name.includes('clan_'))?.id;
  const guildId = encodeGuildId(interaction.guild.id);
  const selectedRoleId = interaction.values[0];

  const replayInfo = tempReplayStore.get(userId);

  if (!replayInfo) {
    return interaction.reply({
      content: '⚠️ 등록 가능한 리플레이가 없습니다.',
      flags: 64, // 임베드 숨김
    });
  }

  if (replayInfo.messageId !== messageId) {
    return interaction.editReply({
      content: '❌ 이 버튼은 당신이 업로드한 리플레이가 아닙니다.',
      flags: 64, // 임베드 숨김
    });
  }

  // replayInfo 의 channelId, botMessageId
  const channel = await interaction.client.channels.fetch(replayInfo.channelId);
  const botMessage = await channel.messages.fetch(replayInfo.botMessageId);

  // 응답 연장
  await interaction.deferUpdate();
  // await interaction.deferReply();

  try {

    const clanMatchData = {
      file_name: replayInfo.name,
      game_type: 3, //스크림
      our_clan_role_id: memberClanRoleId,
      opponent_clan_role_id: selectedRoleId,
    }

    // 클랜 매치 등록
    const resClanMatch = await httpClient.post('/clanMatch', clanMatchData);
    if (resClanMatch.status === "error") {
      throw new Error('clanMatch 등록 실패'); 
    }

    const replayData = {
      fileUrl: replayInfo.url,
      fileName: replayInfo.name,
      createUser: member.displayName,
      game_type: 1, //일반
    }

    const resReplay = await httpClient.post(`/replay/${guildId}`, replayData);
    if (resReplay.status === "error") {
      throw new Error('replay 등록 실패');
    }

    await interaction.deleteReply({
      content: `✅ 리플레이가 성공적으로 등록되었습니다!`,
      components: [],
      flags: 64 // 임베드 숨김
    });

    const ourClanName = getClanRoleName(interaction, memberClanRoleId);
    const opponentClanName = getClanRoleName(interaction, selectedRoleId);
    
    await channel.send({
      content: `✅${member.displayName} 등록성공: 🏆${ourClanName} vs ${opponentClanName}}`,
    });
  } catch (err) {
    console.error('등록 실패:', err);
    await interaction.deleteReply({});
    await channel.send({
      content: `❌ ${member.displayName} 님이 등록에 실패 했습니다. 다시 리플레이 파일을 등록해주세요 이유: ${err.message}`,
    });
  } finally {
    await botMessage.delete();
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
