const httpClient = require('../utils/clientUtils');
const prefix = "/clanMatch";
const { getClanMatchEmbed }= require('../utils/clanMatchEmbedUtils');

/**
 * @description 클랜 매치 서비스
 */
class ClanMatchService {
  constructor() {
    this.baseUrl = prefix;
  }

  /**
   * 
   * @param {*} data 
   * @description 클랜 매치 데이터를 데이터베이스에 등록
   * @returns 
   */
  async insertClanMatch(data) {
    const res = await httpClient.post(this.baseUrl, data);
    if(res.status === "error") {
      throw new Error('클랜 매치 등록 실패');
    }
    return res;
  }

  /**
   * @description 리플레이 데이터를 데이터베이스에 등록
   * @param {*} data 
   */
  async insertReplay(data) {
    const res = await httpClient.post(`/replay/${data.guildId}`, data);
    if(res.status === "error") {
      throw new Error('리플레이 등록 실패');
    }
  }

  /**
   * 
   * @param {Array} game_type not null
   * @param {String} our_clan_name  
   * @param {String} our_clan_role_id  not null
   * @param {String} opponent_clan_role_id  null
   * @description 클랜 매치 데이터를 조회합니다.
   * @returns 
   */
  async getClanMatches(game_type, our_clan_name, our_clan_role_id, opponent_clan_role_id) {
    if (!game_type || !our_clan_role_id) {
      throw new Error("game_type과 our_clan_role_id는 필수입니다.");
    }

    const queryParams = new URLSearchParams({
      game_type: game_type,
      our_clan_role_id: our_clan_role_id,
      opponent_clan_role_id: opponent_clan_role_id || '',
    });

    const url = `${this.baseUrl}?${queryParams.toString()}`;

    const res = await httpClient.get(url);
    console.log(res);
    if (res.status === "error") {
      throw new Error('클랜 매치 데이터 조회 실패');
    }
    if (res.length === 0) {
      return '조회된 클랜 매치 데이터가 없습니다.';
    }
    return getClanMatchEmbed(res, our_clan_name);
  }
}
module.exports = new ClanMatchService();
