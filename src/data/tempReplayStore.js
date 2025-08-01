// 사용자 ID → 업로드된 리플레이 정보 임시 저장소
const replayMap = new Map();

/**
 * data: {
 *    messageId: message.id,
      url: attachment.url,
      name: attachment.name,
      channelId: message.channel.id,
      botMessageId: botMessage.id,
    }
 */


module.exports = {
  set(userId, data) {
    replayMap.set(userId, data);
  },
  get(userId) {
    return replayMap.get(userId);
  },
  delete(userId) {
    replayMap.delete(userId);
  },
  has(userId) {
    return replayMap.has(userId);
  },
};
