// src/interactions/submitReplayHandler.js
const tempReplayStore = require('../data/tempReplayStore');
const axios = require('axios');

module.exports = (interaction) => {
  const customId = interaction.customId;
  const messageId = customId.split(':')[1];
  const userId = interaction.user.id;
  const clanName = interaction.fields.getTextInputValue('clanName');

  const replayInfo = tempReplayStore.get(userId);

  // 유효성 검사
  if (!replayInfo || replayInfo.messageId !== messageId) {
    return interaction.reply({
      content: '⚠️ 업로드된 리플레이 파일을 찾을 수 없습니다. 다시 시도해주세요.',
      ephemeral: true,
    }).catch(console.error);
  }

  // API 전송
  console.log("리플레이 등록요청 시작!");
  // axios.post('http://your-api-url/replay/register', {
  //   url: replayInfo.url,
  //   filename: replayInfo.name,
  //   clan: clanName,
  //   userId: userId,
  // }).then(() => {
  //   return interaction.reply({
  //     content: `✅ 리플레이 파일이 성공적으로 등록되었습니다!`,
  //     ephemeral: true,
  //   });
  // }).then(() => {
  //   tempReplayStore.delete(userId); // 전송 성공 시 저장소에서 제거
  // }).catch((err) => {
  //   console.error('API 전송 실패:', err);
  //   interaction.reply({
  //     content: '❌ 등록 중 오류가 발생했습니다. 다시 시도해주세요.',
  //     ephemeral: true,
  //   }).catch(console.error);
  // });
};
