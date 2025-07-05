// src/interactions/core/interactionHandler.js

const submitReplayHandler = require('../submitReplayHandler');
const scrimButtonHandler = require('../scrimButton');
const dmConfirmHandler = require('../dmConfirm');
const replayRegisterHandler = require('../replayRegisterHandler');
const selectClanHandler = require('../selectClanHandler');

module.exports = (interaction, client) => {
  const customId = interaction.customId;

  // 🔹 모달 제출 처리
  if (interaction.isModalSubmit()) {
    if (customId.startsWith('submitReplay:')) {
      return submitReplayHandler(interaction);
    }

    // 여기에 다른 모달 핸들러도 추가 가능
    console.warn(`[경고] 알 수 없는 모달 customId: ${customId}`);
    return;
  }

  // 🔹 버튼 인터랙션 처리
  if (interaction.isButton()) {
    if (customId.startsWith('setOpen:') || customId.startsWith('setClose:') || customId.startsWith('requestScrim:')) {
      return scrimButtonHandler(interaction);
    }

    if (customId.startsWith('confirmScrim:')) {
      return dmConfirmHandler(interaction);
    }

    if (customId.startsWith('registerReplay:')) {
      return replayRegisterHandler(interaction);
    }

    console.warn(`[경고] 알 수 없는 버튼 customId: ${customId}`);
    return;
  }

  // 🔹 드롭다운(선택 메뉴) 인터랙션 처리
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('selectClan:')) {
      return selectClanHandler(interaction);
    }
  }

  // 🔹 슬래시 커맨드
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    return command.execute(interaction, client).catch((err) => {
      console.error('❌ 커맨드 실행 중 오류 발생:', err);
    });
  }

  // ✳️ 기타 인터랙션도 필요하면 여기에 추가
};
