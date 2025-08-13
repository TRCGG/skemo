// src/commands/myScrims.js
const { SlashCommandBuilder } = require('discord.js');
const scrimStore = require('../stores/scrimStore');
const Scrim = require('../model/scrim');

function byOldFirst(a, b) {
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

function lineOf(s) {
  const ts = Math.floor(Number(s.createdAt || Date.now()) / 1000);
  const title = s.title ? ` - ${s.title}` : '';
  return `<@${s.ownerId}>${title} — [이동](${s.jumpLink}) 🕒 <t:${ts}:t>`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('내스크림')
    .setDescription('내가 작성한 스크림 글을 보여줍니다. (모집중/모집대기)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const mine = scrimStore.findByOwner(userId) || [];

    if (mine.length === 0) {
      return interaction.reply({ content: '현재 내가 작성한 스크림 글이 없습니다.', ephemeral: true });
    }

    const opens = mine.filter(s => s.status === Scrim.Status.OPEN).sort(byOldFirst);
    const waits = mine.filter(s => s.status === Scrim.Status.WAIT).sort(byOldFirst);

    const lines = [];
    lines.push(`📋 내 스크림 — 총 ${mine.length}건 · 모집중 ${opens.length} · 대기 ${waits.length}`);
    lines.push('');
    lines.push(`✅ 모집중 (${opens.length}건)`);
    lines.push(...(opens.length ? opens.map(lineOf) : ['(없음)']));
    lines.push('');
    lines.push(`⌛ 모집대기 (${waits.length}건)`);
    lines.push(...(waits.length ? waits.map(lineOf) : ['(없음)']));

    return interaction.reply({
      content: lines.join('\n'),
      flags: 64,
    });
  },
};
