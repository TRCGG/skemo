// ✅ utils/scrimChannelStore.js
const scrimChannelMap = new Map();

function getChannelKey(user1, user2) {
  const [a, b] = [user1, user2].sort();
  return `${a}_${b}`;
}

function hasChannel(user1, user2) {
  return scrimChannelMap.has(getChannelKey(user1, user2));
}

function setChannel(user1, user2, channelId) {
  scrimChannelMap.set(getChannelKey(user1, user2), channelId);
}

function deleteChannel(user1, user2) {
  scrimChannelMap.delete(getChannelKey(user1, user2));
}

function getChannel(user1, user2) {
  return scrimChannelMap.get(getChannelKey(user1, user2));
}

module.exports = {
  hasChannel,
  setChannel,
  deleteChannel,
  getChannel,
};