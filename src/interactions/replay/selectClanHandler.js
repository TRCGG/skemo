const tempReplayStore = require('../../data/tempReplayStore');
const axios = require('axios');

/**
 * @description 리플레이 등록을 위한 클랜 선택 핸들러
 */

module.exports = async (interaction) => {
  const customId = interaction.customId;
  if (!customId.startsWith('selectClan:')) return;

  const messageId = customId.split(':')[1];
  const userId = interaction.user.id;
  const selectedRoleId = interaction.values[0];
  const replayInfo = tempReplayStore.get(userId);

  // replayInfo 의 channelId, botMessageId
  const channel = await interaction.client.channels.fetch(replayInfo.channelId);
  const botMessage = await channel.messages.fetch(replayInfo.botMessageId);

  if (!replayInfo) {
    return interaction.reply({
      content: '⚠️ 등록 가능한 리플레이가 없습니다.',
      ephemeral: true,
    });
  }

  if (replayInfo.messageId !== messageId) {
    return interaction.reply({
      content: '❌ 이 버튼은 당신이 업로드한 리플레이가 아닙니다.',
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

    // // ✅ messageId 기반 원본 메시지 찾아서 버튼 비활성화
    // const channel = await interaction.client.channels.fetch(replayInfo.channelId);
    // const botMessage = await channel.messages.fetch(replayInfo.botMessageId);

    // const updatedRow = new ActionRowBuilder().addComponents(
    //   botMessage.components[0].components.map((btn) =>
    //     ButtonBuilder.from(btn).setDisabled(true)
    //   )
    // );

    // await botMessage.edit({
    //   components: [updatedRow],
    // });

    await interaction.update({
      content: `✅ 리플레이가 성공적으로 등록되었습니다!`,
      components: [],
    });
  } catch (err) {
    console.error('등록 실패:', err);
    await interaction.reply({
      content: '❌ 등록 중 오류가 발생했습니다.',
      ephemeral: true,
    });
  } finally {
    await botMessage.delete();
    tempReplayStore.delete(userId);
  }
};
