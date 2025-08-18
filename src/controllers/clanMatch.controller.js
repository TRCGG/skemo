// src/controllers/clanMatch.controller.js
const ClanMatchService = require('../service/clanMatch.service');
const { getClanRoleNameByRoleId }= require('../utils/stringUtils');

class ClanMatchController {
  constructor(service = new ClanMatchService()) {
    this.service = service;

    this.handleRegisterReplayAndMatch = this.handleRegisterReplayAndMatch.bind(this);
    this.handleGetClanMatches = this.handleGetClanMatches.bind(this);

    this.handleDeleteClanMatch = this.handleDeleteClanMatch.bind(this);
    this.handleGetClanMatchCount = this.handleGetClanMatchCount.bind(this);
  }

  /**
   * @description 리플레이 등록 + 클랜 매치 등록 + 채널 공지까지 한 번에 처리
   * @param {*} interaction Discord Interaction
   * @param {*} opts {
   *   replayInfo: { url, name, channelId, botMessageId, timeout? },
   *   selectedRoleId: string,   // 상대 클랜 role id
   *   myClanRoleId: string,     // 본인 클랜 role id
   *   guildId: string,   // guildId(interaction.guild.id)
   * }
   */
  async handleRegisterReplayAndMatch(interaction, opts) {
    const { replayInfo, selectedRoleId, myClanRoleId, guildId } = opts || {};

    // 선택 검증
    if (!selectedRoleId) {
      return interaction.reply({ content: '❌ 상대 클랜이 선택되지 않았습니다.', flags: 64 });
    }

    // 응답 연장 (selectMenu 업데이트 응답)
    await interaction.deferUpdate();

    // 필요 리소스
    const member = interaction.member;
    const client = interaction.client;

    // 채널/메시지
    const channel = replayInfo?.channelId
      ? await client.channels.fetch(replayInfo.channelId).catch(() => null)
      : null;

    try {
      // 대기 타이머 정리 (있으면)
      if (replayInfo?.timeout) clearTimeout(replayInfo.timeout);

      // 1) 리플레이 등록
      await this.service.insertReplay({
        fileUrl: replayInfo.url,
        fileName: replayInfo.name,
        createUser: member.displayName,
        game_type: 1,       // 일반
        guildId: guildId,
      });

      // 2) 클랜 매치 등록
      await this.service.insertClanMatch({
        file_name: replayInfo.name,
        game_type: 3,               // 스크림
        our_clan_role_id: myClanRoleId,
        opponent_clan_role_id: selectedRoleId,
        // game_result 는 서버에서 판정/저장 규칙에 맞춰 처리
      });

      // 3) 안내 메시지/에페메랄 정리
      if (channel && replayInfo.botMessageId) {
        const botMsg = await channel.messages.fetch(replayInfo.botMessageId).catch(() => null);
        if (botMsg) await botMsg.delete().catch(() => {});
      }
      await interaction.deleteReply().catch(() => {});

      // 4) 채널 공지
      if (channel) {
        const ourClanName = getClanRoleNameByRoleId(interaction, myClanRoleId);
        const opponentClanName = getClanRoleNameByRoleId(interaction, selectedRoleId);

        await channel.send({
          content: `✅ ${member.displayName} 등록 완료: ${replayInfo.name}  ${ourClanName}🏆 vs ${opponentClanName}`,
        });
      }
    } catch (err) {
      console.error('등록 실패:', err);
      await interaction.deleteReply().catch(() => {});
      if (channel) {
        await channel.send({
          content: `❌ ${member.displayName} 님이 등록에 실패했습니다. 다시 리플레이 파일을 등록해주세요.\n이유: ${err.message}`,
        });
      }
    }
  }

  /**
   * @description (예) 버튼/슬래시 커맨드에서 호출: 클랜 매치 조회
   */
  async handleGetClanMatches(interaction, params) {
    try {
      await interaction.deferReply({ flags: 64 });

      const { empty, content, embed } = await this.service.getClanMatches(params);

      if (empty) {
        return interaction.editReply({ content });
      }
      // 임베드 반환
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('클랜 매치 조회 실패:', err);
      return interaction.editReply({ content: `❌ ${err?.message || '클랜 매치 조회 실패'}` });
    }
  }

  /**
   * @description 클랜 매치 카운트 조회
   */
  async handleGetClanMatchCount(interaction, our_clan_role_id, opponent_clan_role_id) {
    try {

      const count = await this.service.getClanMatchCount(our_clan_role_id, opponent_clan_role_id);
      return count.data.meeting_count || 0; 

    } catch (err) {
      console.error('클랜 매치 카운트 조회 실패:', err);
    }
  }

  /**
   * @description 클랜 매치 삭제
   */
  async handleDeleteClanMatch(interaction, { game_id, guild_id }) {
    try {
      await interaction.deferReply({ flags: 64 });
      await this.service.deleteClanMatch(game_id);
      // 리플레이도 삭제
      await this.service.deleteReplay(game_id, guild_id);
      return interaction.editReply({ content: `🗑️ 삭제 완료: ${game_id}` });
    } catch (err) {
      console.error('클랜 매치 삭제 실패:', err);
      return interaction.editReply({ content: `❌ 삭제 실패: ${err?.message || 'unknown error'}` });
    }
  }

}

module.exports = ClanMatchController;
