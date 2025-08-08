
const Scrim = require('../model/scrim');
const logger = require('../utils/logger');
const {bus, EVENTS} = require('../utils/eventBus');

// src/data/scrimStore.js
class ScrimStore {
  constructor() {
    if (ScrimStore._instance) {
      return ScrimStore._instance; // 싱글톤 보장
    }
    this.store = new Map(); // messageId -> Scrim
    ScrimStore._instance = this;
  }

  add(scrim) {
    this.store.set(scrim.messageId, scrim);
  }

  get(messageId) {
    return this.store.get(messageId);
  }

  delete(messageId) {
    this.store.delete(messageId);
  }

  findByOwner(ownerId) {
    return Array.from(this.store.values())
      .filter(s => s.ownerId === ownerId);
  }

  getAll() {
    return Array.from(this.store.values());
  }

  clear() {
    this.store.clear();
  }

  updateStatus(messageId, newStatus, byUserId) {
    const scrim = this.get(messageId);
    if (!scrim) return { ok: false, error: 'NOT_FOUND' };
    try {
      const { from, to } = scrim.updateStatus(newStatus);
      this.add(scrim); // 저장 갱신

      // 로그
      logger.info('스크림 상태 변경', {
        messageId, guildId: scrim.guildId, from, to, by: byUserId
      });

      // 이벤트 발행
      bus.emit(EVENTS.SCRIM_STATUS_CHANGED, {
        guildId: scrim.guildId,
        scrimId: scrim.messageId,
        byUserId,
        from, to,
        scrim,
      });

      return { ok: true, from, to, scrim };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  apply(messageId, userId) {
    const scrim = this.get(messageId);
    if (!scrim) return { ok: false, reason: 'NOT_FOUND' };
    if (scrim.ownerId === userId) return { ok: false, reason: 'OWNER' };
    if (scrim.status !== Scrim.Status.OPEN) return { ok: false, reason: 'STATE' };
    if (scrim.appliedBy?.includes(userId)) return { ok: false, reason: 'DUPLICATE' };

    scrim.appliedBy = scrim.appliedBy || [];
    scrim.appliedBy.push(userId);
    this.add(scrim);

    logger.info('스크림 신청 접수', { scrimId: scrim.messageId, by: userId, count: scrim.appliedBy.length });

    bus.emit(EVENTS.APPLICATION_RECEIVED, {
      guildId: scrim.guildId,
      scrimId: scrim.messageId,
      applicantUserId: userId,
      appliedCount: scrim.appliedBy.length,
      scrim,
    });

    return { ok: true, scrim };
  }

}

// 항상 같은 인스턴스를 import해서 씀!
module.exports = new ScrimStore();
