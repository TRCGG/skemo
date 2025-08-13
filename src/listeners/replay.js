// src/listeners/replay.js
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const tempReplayStore = require('../stores/tempReplayStore');

// 리플레이 확장자 검사(대소문자 무시)
const isReplayFile = (attachment) => {
  const name = attachment?.name;
  return typeof name === 'string' && name.toLowerCase().endsWith('.rofl');
};

// 환경변수: 기본 60분
const TIMEOUT_MS = Number.parseInt(process.env.REPLAY_TIMEOUT_MS, 10) || 1000 * 60 * 60; 
const TIMEOUT_MIN = Math.max(1, Math.round(TIMEOUT_MS / 60000)); // 안내용 분

module.exports = {
  name: 'messageCreate',
  /**
   * @description 리플레이 파일 업로드 메시지 감지 → 등록 버튼/임시저장/타임아웃 관리
   */
  async execute(message) {
    if (!message || message.author?.bot) return;
    if (!message.guildId) return; // DM 제외

    try {
      // 첨부 중 첫 번째 .rofl 선택
      const attachment = message.attachments?.find?.(isReplayFile);
      if (!attachment) return;

      const userId = message.author.id;

      // ✅ 같은 유저의 기존 대기건이 있으면 정리(한 건만 허용)
      const prev = tempReplayStore.get(userId);
      if (prev) {
        try {
          if (prev.timeout) clearTimeout(prev.timeout);
          if (prev.channelId && prev.botMessageId) {
            const ch = await message.client.channels.fetch(prev.channelId).catch(() => null);
            const prevMsg = ch ? await ch.messages.fetch(prev.botMessageId).catch(() => null) : null;
            if (prevMsg) await prevMsg.delete().catch(() => {});
          }
        } catch (e) {
          console.warn('이전 대기건 정리 실패:', e?.message || e);
        } finally {
          tempReplayStore.delete(userId);
          // (선택) 교체 알림
          try {
            await message.channel.send(`🔁 <@${userId}> 이전 대기 리플레이를 취소하고 새 파일로 교체합니다.`);
          } catch {}
        }
      }

      // 버튼 구성
      const registerButton = new ButtonBuilder()
        .setCustomId(`registerReplay:${message.id}`)
        .setLabel('📥 리플레이 등록')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(registerButton);

      // 파일명 표시(확장자 제거, 대소문자 무관)
      const rawName = attachment.name ?? 'unknown.rofl';
      const fileName = rawName.toLowerCase().endsWith('.rofl')
        ? rawName.slice(0, -5)
        : rawName;

      // 안내 + 버튼 전송
      const botMessage = await message.reply({
        content: [
          '📂 리플레이 파일이 업로드되었습니다.',
          `• 파일: **${fileName}**`,
          `• 유효시간: **${TIMEOUT_MIN}분** (자동 취소)`,
          '아래 버튼을 눌러 **상대한 클랜**을 등록해주세요. (업로더만 등록 가능)',
        ].join('\n'),
        components: [row],
      });

      // 타임아웃 작업
      const timeout = setTimeout(async () => {
        try {
          const channel = await message.client.channels.fetch(message.channel.id);
          const botMsg = await channel.messages.fetch(botMessage.id);
          await botMsg.delete().catch(() => {});
          await channel.send({
            content: `⏰ <@${userId}>님, **${TIMEOUT_MIN}분** 동안 등록이 이루어지지 않아 리플레이 등록이 취소되었습니다.`,
          });
        } catch (err) {
          console.warn('자동 삭제/안내 실패:', err?.message || err);
        }
        tempReplayStore.delete(userId);
      }, TIMEOUT_MS);

      // ✅ 사용자당 1건 대기 저장
      tempReplayStore.set(userId, {
        messageId: message.id,
        url: attachment.url,
        name: fileName,
        channelId: message.channel.id,
        botMessageId: botMessage.id,
        timeout,
      });
    } catch (err) {
      console.error('[replay.js] 처리 중 오류:', err?.stack || err);
    }
  },
};
