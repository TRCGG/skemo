const { EventEmitter } = require('node:events');
const bus = new EventEmitter();

// 공통 이벤트 명세(추가해가면 됨)
const EVENTS = {
  SCRIM_CREATED: 'scrim.created',
  SCRIM_STATUS_CHANGED: 'scrim.statusChanged',
  APPLICATION_RECEIVED: 'application.received',
  MATCH_CONFIRMED: 'match.confirmed',
};

module.exports = { bus, EVENTS };
