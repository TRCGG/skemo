// src/commands/모집목록.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const scrimStore = require('../stores/scrimStore'); // getAll(), isOpen(scrim)

function isWaiting(scrim) {
  if (!scrim || typeof scrim.status !== 'string') return false;
  return scrim.status.includes('대기'); // 예: '❌ 모집 대기'
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('모집목록')
    .setDescription('현재 올라온 스크림 등록글을 상태별로 보여줍니다. (모집중/모집대기)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const all = Array.isArray(scrimStore.getAll?.()) ? scrimStore.getAll() : [];
    if (all.length === 0) {
      return interaction.reply({ content: '현재 등록된 스크림 글이 없습니다.', ephemeral: true });
    }

    // 분류
    const opens = all.filter(s => scrimStore.isOpen?.(s));
    const waits = all.filter(s => isWaiting(s));

    // 오래된 → 최신(아래)
    const byOldFirst = arr => [...arr].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    const makeLines = (arr) => {
      return byOldFirst(arr).map((it) => {
        const ts = Math.floor(Number(it.createdAt || Date.now()) / 1000);
        const owner = it.ownerId ? `<@${it.ownerId}>` : '알 수 없음';
        const title = it.title ? ` - ${it.title}` : '';
        const link = `https://discord.com/channels/${it.guildId}/${it.channelId}/${it.messageId}`;
        return `• ${owner}${title} — [이동](${link}) 🕒 <t:${ts}:t>`;
      });
    };

    const lines = [];
    lines.push(`🟢 모집중 (${opens.length}건)`);
    lines.push(...(opens.length ? makeLines(opens) : ['(없음)']));
    lines.push('');
    lines.push(`⌛ 모집대기 (${waits.length}건)`);
    lines.push(...(waits.length ? makeLines(waits) : ['(없음)']));

    return interaction.reply({
      content: lines.join('\n'),
      // flags: 64,
    });
  },
};
