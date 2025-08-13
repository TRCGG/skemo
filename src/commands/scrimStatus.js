// src/commands/status.js (모집현황)
const { SlashCommandBuilder } = require("discord.js");
const scrimStore = require("../stores/scrimStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("모집현황")
    .setDescription("현재 모집 중인 스크림 목록을 보여줍니다."),

  async execute(interaction) {
    const all =
      typeof scrimStore.getAll === "function" ? scrimStore.getAll() : [];
    if (!Array.isArray(all) || all.length === 0) {
      return interaction.reply({
        content: "현재 모집 중인 스크림이 없습니다.",
        flags: 64,
      });
    }

    // 1) open만 필터
    const openItems = scrimStore.getOpen();
    if (openItems.length === 0) {
      return interaction.reply({
        content: "현재 모집 중인 스크림이 없습니다.",
        flags: 64,
      });
    }

    // 2) createdAt(숫자 ms) 기준으로 오래된→최신 정렬
    openItems.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    // 3) KST 기준 "오늘" 카운트
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const startOfKstDayUtc = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      )
    );
    const endOfKstDayUtc = new Date(
      startOfKstDayUtc.getTime() + 24 * 60 * 60 * 1000
    );

    const totalCount = openItems.length;
    const todayCount = openItems.filter((it) => {
      const ts = Number(it.createdAt || 0);
      return ts >= startOfKstDayUtc.getTime() && ts < endOfKstDayUtc.getTime();
    }).length;

    // 4) 출력 문자열
    const lines = [
      `📢 현재 모집 중인 스크림 — 총 ${totalCount}건 · 오늘 ${todayCount}건`,
    ];

    for (const it of openItems) {
      const link = `https://discord.com/channels/${it.guildId}/${it.channelId}/${it.messageId}`;
      const ts = Math.floor(Number(it.createdAt || Date.now()) / 1000); // 디스코드 타임스탬프
      const owner = it.ownerId ? `<@${it.ownerId}>` : "알 수 없음";
      const title = it.title ? ` - ${it.title}` : "";
      lines.push(`${owner}${title} — [모집글 보기](${link}) 🕒 <t:${ts}:t>`);
    }

    return interaction.reply({
      content: lines.join("\n"),
      flags: 64, 
    });
  },
};
