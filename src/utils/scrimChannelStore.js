// utils/scrimChannelStore.js
const { ChannelType } = require('discord.js');

const PAIR_PREFIX = 'scrimPair='; // topic에 심을 표식: scrimPair=<A>|<B>
const MAX_CHANNEL_NAME = 100;

function normalizeChannelName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')   // 공백 → -
    .replace(/-+/g, '-');   // 연속 - 축소
}

// 채널명 빌더
function buildScrimChannelName(hostTitle, guestTitle) {
  const prefix = '스크림-';       // 최종 포맷: `${prefix}${h}-${g}`
  const sepLen = 1;               // h와 g 사이 하이픈 1개
  const norm = (s) => normalizeChannelName(s || '');

  // 비어있을 때를 대비한 기본값
  let h = norm(hostTitle) || 'host';
  let g = norm(guestTitle) || 'guest';

  // prefix + '-' 사이 구분자 하나를 제외하고 h/g에 쓸 수 있는 총 길이
  const maxForPair = MAX_CHANNEL_NAME - prefix.length - sepLen;

  // 둘 다 합쳐서 maxForPair 이하여야 한다.
  if (h.length + g.length > maxForPair) {
    // 기본은 반반
    let hMax = Math.floor(maxForPair / 2);
    let gMax = maxForPair - hMax;

    // 한쪽이 짧으면 남는 몫을 다른 쪽에 할당
    if (h.length < hMax) { gMax += (hMax - h.length); hMax = h.length; }
    if (g.length < gMax) { hMax += (gMax - g.length); gMax = g.length; }

    // 최종 자르기
    h = h.slice(0, hMax);
    g = g.slice(0, gMax);
  }

  return `${prefix}${h}-${g}`;
}

function isTextChannel(ch) {
  return ch?.type === ChannelType.GuildText || ch?.type === 0 || ch?.type === 'GUILD_TEXT';
}
function normalizePair(a, b) {
  return [String(a), String(b)].sort(); // 사전식 정렬로 순서 무시
}
function makePairTag(a, b) {
  const [x, y] = normalizePair(a, b);
  return `${PAIR_PREFIX}${x}|${y}`;
}
function extractPairFromTopic(topic = '') {
  const m = String(topic).match(/scrimPair=([^\s|]+)\|([^\s|]+)/);
  return m ? normalizePair(m[1], m[2]) : null;
}

/** guild 내에서 (a,b) 쌍이 이미 있는 채널 id 찾기 */
async function getChannelIdByScrimPair(guild, a, b) {
  const key = normalizePair(a, b).join('|');

  // 1) 캐시
  let found = guild.channels.cache.find((ch) => {
    if (!isTextChannel(ch)) return false;
    const pair = extractPairFromTopic(ch.topic);
    return pair && pair.join('|') === key;
  });
  if (found) return found.id;

  // 2) 최신 fetch
  const fetched = await guild.channels.fetch().catch(() => null);
  if (!fetched) return null;

  found = fetched.find((ch) => {
    if (!isTextChannel(ch)) return false;
    const pair = extractPairFromTopic(ch.topic);
    return pair && pair.join('|') === key;
  });

  return found?.id ?? null;
}

/** 채널 topic에 scrimPair 태그 심기/갱신 */
async function setScrimPairTopic(channel, a, b) {
  const tag = makePairTag(a, b);
  const before = channel.topic || '';
  const hasOld = /scrimPair=[^\s]+/.test(before);
  const next = hasOld ? before.replace(/scrimPair=[^\s]+/, tag) : (before ? `${before} ${tag}` : tag);
  if (next !== before) await channel.setTopic(next).catch(() => null);
}

module.exports = {
  getChannelIdByScrimPair,
  setScrimPairTopic,
  makePairTag,
  normalizePair,
  buildScrimChannelName,
};
