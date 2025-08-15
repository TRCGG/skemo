const scrimStore = require('../stores/scrimStore');
const logger = require('../utils/logger');
const { removeOpenRoleIfNoOpen } = require('../utils/roleUtils');

/**
 * 
 * @desc 스크림 취소 버튼 핸들러
 */
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;
  const [action, scrimMessageId, ownerId] = interaction.customId.split(":");

  const ownerScrim = scrimStore.get(scrimMessageId);
  const applicantUserId = interaction.user.id; // 버튼을 누른 사용자 ID

    // 작성자 전용 액션 보호
  if (applicantUserId !== ownerId) {
    return interaction.reply({ content: '❌ 이 버튼은 모집글 작성자만 사용할 수 있습니다.', flags: 64 });
  }

  try {
    const guild = await interaction.client.guilds.fetch(ownerScrim.guildId);
    const ch = await guild.channels.fetch(ownerScrim.channelId);
    const msg = await ch.messages.fetch(ownerScrim.messageId);
    await msg.delete().catch(() => null);
  } catch (e) {
    console.error('스크림 삭제 실패:', e?.message || e);
  } finally {
    logger.info('스크림 취소', { title: `${ownerScrim.title}`, host: `<@${ownerScrim.ownerId}>`});
    scrimStore.delete(ownerScrim.messageId);
    await removeOpenRoleIfNoOpen(interaction.client, ownerScrim.guildId, ownerId);
  }

  return interaction.update({ content: '🗑️ 등록글을 삭제했습니다.', components:[], flags: 64 });
}