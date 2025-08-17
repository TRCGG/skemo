const { http } = require('./httpClient.js');
const { encodeGuildId } = require('../utils/stringUtils.js');
const API_BASE_URL = process.env.BASE_URL;

// 외부(백엔드) API 주소 규칙만 관리
class ClanMatchApiClient {
  constructor(baseUrl = API_BASE_URL) {
    if (!baseUrl) throw new Error('BASE_URL이 설정되지 않았습니다.');
    this.root = String(baseUrl).replace(/\/$/, ''); // 끝 슬래시 제거
    this.prefix = '/clanMatch';
    this.base = `${this.root}${this.prefix}`;   
  }

  // 클랜 매치 등록
  async insertClanMatch(payload) {
    return http.post(this.base, { body: payload });
  }

  // 리플레이 등록
  async insertReplay(payload) {
    const guild_id = encodeGuildId(payload.guildId);
    return http.post(`${this.root}/replay/${guild_id}`, { body: payload });
  }

  // 클랜 매치 조회
  async getClanMatches({ game_type, our_clan_role_id, opponent_clan_role_id }) {
    // 기존 코드와 동일하게 배열은 콤마로 join되는 URLSearchParams 기본 동작을 사용
    const query = new URLSearchParams({
      game_type,
      our_clan_role_id,
      opponent_clan_role_id: opponent_clan_role_id || '',
    });
    const url = `${this.base}?${query.toString()}`;
    return http.get(url);
  }

  // 클랜 매치 카운트 조회
  async getClanMatchCount(our_clan_role_id, opponent_clan_role_id) {
    const query = new URLSearchParams({
      our_clan_role_id,
      opponent_clan_role_id: opponent_clan_role_id || '',
    });

    const url = `${this.base}/count?${query.toString()}`;
    return http.get(url);
  }

  // 클랜 매치 삭제 //TODO: 실제로는 game_id로 삭제 변경 필요
  async deleteClanMatch(file_name) {
    const query = new URLSearchParams({ file_name });
    const url = `${this.base}?${query.toString()}`;
    return http.delete(url);
  }

  async deleteReplay(file_name, guild_id) {
    guild_id = encodeGuildId(guild_id);
    const url = `${this.root}/replay/${file_name}/${guild_id}`;
    return http.delete(url);
  }

}

module.exports = ClanMatchApiClient;


