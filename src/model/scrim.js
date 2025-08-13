// src/data/scrim.js

class Scrim {
  static Status = Object.freeze({
    WAIT: 'WAIT',   // 모집 대기
    OPEN: 'OPEN',         // 모집중
    CLOSED: 'CLOSED',     // 모집 종료
    CONFIRMED: 'CONFIRMED', // 확정
  });

  static StatusBadge  = Object.freeze({
    WAIT: '❌ 모집 대기',        // 모집 대기
    OPEN: '🟢 모집중 ',        // 모집중
    CANCEL: '🛑 취소',    // 취소
    CONFIRMED: '🤝 매칭확정', // 매칭 확정
  });

  constructor({ 
    messageId,
    channelId,
    guildId,
    ownerId,
    author,
    title,
    clan,
    players = [],
    time,
    etc,
    status = Scrim.Status.WAIT,  // 1 모집대기 2 모집중 3 모집종료 4 확정
    createdAt = Date.now(),
    appliedBy = [],
  }) {
    this.messageId = messageId;
    this.channelId = channelId;
    this.guildId = guildId;
    this.ownerId = ownerId;

    this.author = author; // User 객체
    this.title = title;
    this.clan = clan;
    this.players = players;
    this.time = time;
    this.etc = etc;

    this.status = status;
    this.createdAt = createdAt;
    this.appliedBy = appliedBy;
  }

  get jumpLink() {
    return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.messageId}`;
  }

  get statusBadge() {
    return Scrim.StatusBadge[this.status] ?? this.status;
  }

  getApplicantCount() {
    return this.appliedBy.length;
  }

  hasApplicant(userId) {
    return this.appliedBy.includes(userId);
  }

  addApplicant(userId) {
    if (this.hasApplicant(userId)) {
      return { ok: false, reason: 'DUPLICATE' };
    }
    this.appliedBy.push(userId);
    return { ok: true };
  }
  
  removeApplicant(userId) {
    const idx = this.appliedBy.indexOf(userId);
    if (idx !== -1) {
      this.appliedBy.splice(idx, 1);
      return { ok: true };
    }
    return { ok: false, reason: 'NOT_FOUND' };
  }

  updateStatus(newStatus) {
    // ✅ 언제든 취소 가능
    if (newStatus === Scrim.Status.CANCEL) {
      const from = this.status;
      this.status = Scrim.Status.CANCEL;
      return { from, to: Scrim.Status.CANCEL };
    }

    // 그 외 전이는 규칙 적용
    const valid = {
      [Scrim.Status.WAIT]:      [Scrim.Status.OPEN],
      [Scrim.Status.OPEN]:      [Scrim.Status.CONFIRMED],
      [Scrim.Status.CONFIRMED]: [], // 확정 후엔 취소만 가능(위에서 이미 허용)
      [Scrim.Status.CANCEL]:    [], // 취소에서 다른 상태로는 못 가게
    };

    const allowed = valid[this.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`❌ 상태 전환 불가: ${this.status} → ${newStatus}`);
    }

    this.status = newStatus;
    return this.status;
  }
}

module.exports = Scrim;
