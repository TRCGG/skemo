const Scrim = require('../model/scrim');
const logger = require('../utils/logger');
const { bus, EVENTS } = require('../utils/eventBus');

class ScrimStore {
  constructor() {
    if (ScrimStore._instance) return ScrimStore._instance;
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
    return Array.from(this.store.values()).filter(s => s.ownerId === ownerId);
  }

  getAll() {
    return Array.from(this.store.values());
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }

  /**
   * 스크림 상태 업데이트
   */
  updateScrimStatus(messageId, newStatus) {
    const scrim = this.get(messageId);
    if (!scrim) return { ok: false, error: 'NOT_FOUND' };
    try {
      const { from, to } = scrim.updateStatus(newStatus);
      this.add(scrim); // 저장 갱신

      // logger.info('스크림 상태 변경', { messageId, guildId: scrim.guildId, from, to });

      // bus.emit(EVENTS.SCRIM_STATUS_CHANGED, {
      //   guildId: scrim.guildId,
      //   scrimId: scrim.messageId,
      //   from,
      //   to,
      //   scrim,
      // });

      return { ok: true, from, to, scrim };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /**
   * 스크림 신청
   */
  apply(messageId, userId) {
    const scrim = this.get(messageId);
    if (!scrim) return { ok: false, reason: 'NOT_FOUND' };
    if (scrim.ownerId === userId) return { ok: false, reason: 'OWNER' };
    if (scrim.status !== Scrim.Status.OPEN) return { ok: false, reason: 'STATE' };
    if (scrim.appliedBy?.includes(userId)) return { ok: false, reason: 'DUPLICATE' };

    scrim.appliedBy = scrim.appliedBy || [];
    scrim.appliedBy.push(userId);
    this.add(scrim);

    logger.info('스크림 신청 접수', {
      title: `[${scrim.title}](${scrim.jumpLink})`,
      host: `<@${scrim.ownerId}>`,
      by: `<@${userId}>`,
      count: scrim.appliedBy.length,
    });

    bus.emit(EVENTS.APPLICATION_RECEIVED, {
      guildId: scrim.guildId,
      scrimId: scrim.messageId,
      applicantUserId: userId,
      appliedCount: scrim.appliedBy.length,
      scrim,
    });

    return { ok: true, scrim };
  }

  /**
   * 모집중 여부
   * - 상태는 enum(코드값)으로 **정확히 일치** 비교 권장
   */
  isOpen(scrim) {
    return scrim?.status === Scrim.Status.OPEN;
  }

  /**
   * 모집중 목록
   */
  getOpen() {
    return this.getAll().filter(scrim => this.isOpen(scrim));
  }

  /**
   * 14일 지난 글 삭제
   */
  deleteOlderThan14Days() {
    const now = Date.now();
    const limitMs = 14 * 24 * 60 * 60 * 1000;
    let removed = 0;

    // ✅ this.store 사용
    for (const s of this.store.values()) {
      if (!s?.createdAt) continue;
      if (now - s.createdAt > limitMs) {
        this.store.delete(s.messageId);
        removed++;
      }
    }
    return removed;
  }
}

module.exports = new ScrimStore();
