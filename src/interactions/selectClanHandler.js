const tempReplayStore = require('../data/tempReplayStore');
const axios = require('axios');

module.exports = async (interaction) => {
  const customId = interaction.customId;
  if (!customId.startsWith('selectClan:')) return;

  const messageId = customId.split(':')[1];
  const userId = interaction.user.id;
  const selectedRoleId = interaction.values[0];

  const replayInfo = tempReplayStore.get(userId);

  if (!replayInfo || replayInfo.messageId !== messageId) {
    return interaction.reply({
      content: '⚠️ 등록할 리플레이 파일이 없습니다.',
      ephemeral: true,
    });
  }

  try {
    // await axios.post('http://your-api-url/replay/register', {
    //   url: replayInfo.url,
    //   filename: replayInfo.name,
    //   role_id: selectedRoleId,
    //   user_id: userId,
    // });

    console.log("API 송신", selectedRoleId, replayInfo.url, replayInfo.name, userId);

    tempReplayStore.delete(userId);

    await interaction.update({
      content: `✅ 리플레이 등록이 완료되었습니다.`,
      components: [],
    });
  } catch (err) {
    console.error('등록 실패:', err);
    await interaction.reply({
      content: '❌ 등록 중 오류가 발생했습니다.',
      ephemeral: true,
    });
  }
};
