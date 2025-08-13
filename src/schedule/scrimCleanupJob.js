// src/jobs/scrimCleanupJob.js
const cron = require('node-cron');
const scrimStore = require('../stores/scrimStore');

function registerScrimCleanupJob() {
  console.log("scrimCleanUp job registered");
  // 매일 새벽 3시 실행
  cron.schedule('0 3 * * *', () => {
    const removed = scrimStore.deleteOlderThan14Days();
    if (removed > 0) {
      console.log(`[scrimCleanupJob] 14일 초과 글 ${removed}개 삭제`);
    }
  }, { timezone: 'Asia/Seoul' });
}

module.exports = { registerScrimCleanupJob };
