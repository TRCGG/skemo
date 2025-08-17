// src/services/clanMatch.service.js
const ClanMatchApiClient = require('../api/clanMatch.client');
const { getClanMatchEmbed } = require('../utils/clanMatchEmbedUtils');

const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

class ClanMatchService {
  constructor(client = new ClanMatchApiClient()) {
    this.client = client;
  }

  /**
   * @description 클랜 매치 등록
   */
  async insertClanMatch(payload) {
    const {
      file_name,
      our_clan_role_id,
      opponent_clan_role_id,
      game_type,
    } = payload || {};

    if (!isNonEmptyStr(file_name)) throw new Error('file_name 누락');
    if (!isNonEmptyStr(our_clan_role_id)) throw new Error('our_clan_role_id 누락');
    if (!isNonEmptyStr(opponent_clan_role_id)) throw new Error('opponent_clan_role_id 누락');
    if (our_clan_role_id === opponent_clan_role_id) throw new Error('같은 클랜끼리는 매치 불가');

    const res = await this.client.insertClanMatch(payload);
    if (res?.status === 'error') throw new Error('클랜 매치 등록 실패');
    return res;
  }

  /**
   * @description 리플레이 등록
   */
  async insertReplay(payload) {
    if (!payload || !isNonEmptyStr(payload.guildId)) {
      throw new Error('guildId 누락');
    }
    const res = await this.client.insertReplay(payload);
    if (res?.status === 'error') throw new Error('리플레이 등록 실패');
    return res;
  }

  /**
   * @description 클랜 매치 조회 → 임베드 생성까지 반환
   */
  async getClanMatches({ game_type, our_clan_name, our_clan_role_id, opponent_clan_role_id }) {
    if (!game_type || !isNonEmptyStr(our_clan_role_id)) {
      throw new Error('game_type과 our_clan_role_id는 필수입니다.');
    }

    const res = await this.client.getClanMatches({
      game_type,
      our_clan_role_id,
      opponent_clan_role_id,
    });

    if (res?.status === 'error') throw new Error('클랜 매치 데이터 조회 실패');

    // 조회 결과가 배열이라고 가정 (기존 코드 유지)
    if (Array.isArray(res) && res.length === 0) {
      return { empty: true, content: '조회된 클랜 매치 데이터가 없습니다.' };
    }

    // getClanMatchEmbed 유틸을 그대로 사용
    const embed = getClanMatchEmbed(res.data, our_clan_name);
    return { empty: false, embed };
  }

  /**
   * @description 클랜 매치 카운트 조회
   */
  async getClanMatchCount(our_clan_role_id, opponent_clan_role_id) {
    if (!our_clan_role_id || !opponent_clan_role_id) {
      throw new Error('our_clan_role_id와 opponent_clan_role_id는 필수입니다.');
    }
    
    const res = await this.client.getClanMatchCount(our_clan_role_id, opponent_clan_role_id);
    if (res?.status === 'error') throw new Error('클랜 매치 카운트 조회 실패');
    return res;
  }

  /** 
  * @description 클랜 매치 삭제
  */
  async deleteClanMatch(game_id) {
    if (!game_id || String(game_id).trim().length === 0) {
      throw new Error('game_id가 비어있습니다.');
    }
    const res = await this.client.deleteClanMatch(game_id);
    if (res?.status === 'error') throw new Error(res.message || '클랜 매치 삭제 실패');
    return res;
  }

  /**
   * @description 리플레이 삭제
   */
  async deleteReplay(file_name, guild_id) {
    if (!file_name || String(file_name).trim().length === 0) {
      throw new Error('file_name이 비어있습니다.');
    }
    if (!guild_id || String(guild_id).trim().length === 0) {
      throw new Error('guild_id가 비어있습니다.');
    }
    const res = await this.client.deleteReplay(file_name, guild_id);
    if (res?.status === 'error') throw new Error(res.message || '리플레이 삭제 실패');
    return res;
  }
}

module.exports = ClanMatchService;
