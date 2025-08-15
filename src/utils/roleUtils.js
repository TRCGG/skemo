// src/utils/roleUtils.js
const Scrim = require('../model/scrim');
const scrimStore = require('../stores/scrimStore');

const ROLE_NAME_OPEN = '스크림모집중';

/**
 * 
 * @desc 스크림 모집 중 역할을 제거합니다. 만약 해당 사용자가 열려있는 스크림이 없다면 역할을 제거합니다.
 * @param {import('discord.js').Client} client - Discord 클라이언트
 * @param {string} guildId - 길드 ID
 * @param {string} ownerId - 스크림 작성자 ID
 */
async function removeOpenRoleIfNoOpen(client, guildId, ownerId) {
  try {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;
    const role = guild.roles.cache.find(r => r.name === ROLE_NAME_OPEN);
    if (!role) return;

    const hasOpen = scrimStore.findByOwner(ownerId).some(s => s.status === Scrim.Status.OPEN);
    if (hasOpen) return;

    // 역할 제거
    const member = await guild.members.fetch(ownerId).catch(() => null);
    if (member?.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => null);
    }
  } catch (err){ console.error('removeOpenRoleIfNoOpen error:', err); }
}

module.exports = { removeOpenRoleIfNoOpen };
