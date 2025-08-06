// src/scrim/store.js

const scrimStore = new Map(); // key: 모집 embed 메시지 ID

function setScrim(id, data) {
  scrimStore.set(id, data);
}

function getScrim(id) {
  return scrimStore.get(id);
}

function deleteScrim(id) {
  scrimStore.delete(id);
}

module.exports = { setScrim, getScrim, deleteScrim };
