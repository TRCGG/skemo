const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const scrimStore = require('../stores/scrimStore');

const MODAL_ID_PREFIX = 'matchConfirmModal';
const MODAL_TIME_INPUT_ID = 'confirm_time';

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, hostScrimId, guestScrimId] = String(interaction.customId).split(':');
  if (action !== 'matchConfirm') return;

  const hostScrim = scrimStore.get(hostScrimId);
  const guestScrim = scrimStore.get(guestScrimId);
  if (!hostScrim || !guestScrim) {
    return interaction.reply({ content: '❌ 스크림 정보를 찾을 수 없습니다.', flags: 64 });
  }

  // 권한: 두 등록자만 가능
  const userId = interaction.user.id;
  if (![hostScrim.ownerId, guestScrim.ownerId].includes(userId)) {
    return interaction.reply({ content: '❌ 확정할 권한이 없습니다.', flags: 64 });
  }

  // 모달 띄우기 (원본 메시지 id를 customId에 포함)
  const modal = new ModalBuilder()
    .setCustomId(`${MODAL_ID_PREFIX}:${hostScrimId}:${guestScrimId}:${interaction.message.id}`)
    .setTitle('스크림 확정');

  const timeInput = new TextInputBuilder()
    .setCustomId(MODAL_TIME_INPUT_ID)
    .setLabel('확정 시간 (예: 8/15 21:00)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('예: 8/15 21:00')
    .setRequired(false);

  modal.addComponents(new ActionRowBuilder().addComponents(timeInput));
  return interaction.showModal(modal);
};
