// src/interactions/core/interactionHandler.js

// const submitReplayHandler = require('../submitReplayHandler');
const scrimButtonHandler = require('../scrimButtonHandler');
const scrimCancelHandler = require('../scrimCancelHandler');
const scrimDmConfirmHandler = require('../scrimDmConfirmHandler');
const replayRegisterHandler = require('../replay/replayRegisterHandler');
const selectClanHandler = require('../replay/selectClanHandler');
const selectOwnScrimHandler = require('../selectOwnScrimHandler');
const matchConfirmHandler = require('../matchConfirmHandler');
const matchCancelHandler  = require('../matchCancelHandler');
const matchConfirmModalHandler = require('../matchConfirmModalHandler');
const cancelAbortHandler = require('../cancelAbortHandler'); // 취소 버튼 핸들러

/**
 * 
 * @description Discord 인터랙션 핸들러
 */

module.exports = (interaction, client) => {
  const customId = interaction.customId;

  // 🔹 모달 제출 처리
  if (interaction.isModalSubmit()) {
    if (customId.startsWith('submitReplay:')) {
      // return submitReplayHandler(interaction);
    }

    if (customId.startsWith('matchConfirmModal:')) {
      return matchConfirmModalHandler(interaction);
    } 
    // 여기에 다른 모달 핸들러도 추가 가능
    console.warn(`[경고] 알 수 없는 모달 customId: ${customId}`);
    return;
  }

  // 🔹 버튼 인터랙션 처리
  if (interaction.isButton()) {
    if (
      customId.startsWith('setOpen:')  ||
      customId.startsWith('setClose:') || 
      customId.startsWith('applyScrim:')
    ) {
      return scrimButtonHandler(interaction);
    }

    if (customId.startsWith('scrimCancelConfirm:')) {
      return scrimCancelHandler(interaction);
    }

    if (customId.startsWith('scrimConfirm:')) {
      return scrimDmConfirmHandler(interaction);
    }

    if (customId.startsWith('registerReplay:')) {
      return replayRegisterHandler(interaction);
    }

    if (customId.startsWith('matchConfirm:')){
      return matchConfirmHandler(interaction);
    }

    if (
      customId.startsWith('matchCancel:' ) || 
      customId.startsWith('matchCancelConfirm:')
    ) {
      return matchCancelHandler(interaction);
    }

    if (customId.startsWith('cancelAbort')) {
      return cancelAbortHandler(interaction);
    }

    console.warn(`[경고] 알 수 없는 버튼 customId: ${customId}`);
    return;
  }

  // 🔹 드롭다운(선택 메뉴) 인터랙션 처리
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('selectClan:')) {
      return selectClanHandler(interaction);
    }

    if (interaction.customId.startsWith('selectOwnScrim:')){
      return selectOwnScrimHandler(interaction);
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
