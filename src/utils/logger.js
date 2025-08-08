const levels = ['debug', 'info', 'warn', 'error'];
let clientRef = null;
let channelId = process.env.LOG_CHANNEL_ID || null;
const currentLevel = process.env.LOG_LEVEL || 'info';

function setClient(client) { clientRef = client; }
function setChannel(id) { channelId = id; }

function shouldLog(level) {
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

async function postToChannel(level, msg) {
  if (!clientRef || !channelId) return;
  try {
    const ch = await clientRef.channels.fetch(channelId);
    if (!ch) return;
    await ch.send(`[\`${level.toUpperCase()}\`] ${msg}`);
  } catch {}
}

function log(level, msg, obj) {
  if (!shouldLog(level)) return;
  const line = obj ? `${msg} ${JSON.stringify(obj)}` : msg;
  // 콘솔
  const fn = console[level] || console.log;
  fn(`[${level}] ${line}`);
  // 채널
  postToChannel(level, line);
}

module.exports = {
  setClient,
  setChannel,
  debug: (m, o) => log('debug', m, o),
  info:  (m, o) => log('info',  m, o),
  warn:  (m, o) => log('warn',  m, o),
  error: (m, o) => log('error', m, o),
};
