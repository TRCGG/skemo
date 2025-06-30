
/**
 * 모집 정보를 저장하는 모듈
 */

const activeRecruitments = new Map();

/**
 * 모집 정보를 저장합니다.
 * @param {string} userId - 유저 ID
 * @param {object} data - { channelId: string, messageId: string }
 */
function setRecruitment(userId, data) {
  activeRecruitments.set(userId, data);
}

/**
 * 유저의 모집 정보를 가져옵니다.
 * @param {string} userId - 유저 ID
 * @returns {{ channelId: string, messageId: string } | undefined}
 */
function getRecruitment(userId) {
  return activeRecruitments.get(userId);
}

/**
 * 유저의 모집 정보를 삭제합니다.
 * @param {string} userId - 유저 ID
 */
function deleteRecruitment(userId) {
  activeRecruitments.delete(userId);
}

/**
 * 모든 모집 정보를 entries 형태로 가져옵니다.
 * @returns {IterableIterator<[string, { channelId: string, messageId: string }]>}
 */
function getAllRecruitments() {
  return activeRecruitments.entries();
}

function getSize() {
  return activeRecruitments.size;
}

module.exports = {
  setRecruitment,
  getRecruitment,
  deleteRecruitment,
  getAllRecruitments,
  getSize
};
