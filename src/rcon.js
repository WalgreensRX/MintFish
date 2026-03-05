// Rust WebSocket RCON — connects to ws://host:port/<password>
// Sends/receives JSON: { Identifier, Message, Type }

const WebSocket = require('ws');

const RECONNECT_BASE_MS = 5_000;
const RECONNECT_MAX_MS = 60_000;
const COMMAND_TIMEOUT_MS = 10_000;

let ws = null;
let connected = false;
let reconnectDelay = RECONNECT_BASE_MS;
let reconnecting = false;
let nextId = 1;
const pending = new Map();

function getUrl() {
  const { RCON_HOST, RCON_PORT, RCON_PASSWORD } = process.env;
  return `ws://${RCON_HOST}:${Number(RCON_PORT) || 28016}/${RCON_PASSWORD}`;
}

function connect() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(getUrl());

    ws.once('open', () => {
      connected = true;
      reconnectDelay = RECONNECT_BASE_MS;
      console.log('[RCON] Connected.');
      resolve();
    });

    ws.once('error', (err) => {
      if (!connected) reject(err);
      else console.error('[RCON] Error:', err.message);
    });

    ws.on('message', (data) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      const cb = pending.get(msg.Identifier);
      if (cb) {
        clearTimeout(cb.timer);
        pending.delete(msg.Identifier);
        cb.resolve(msg.Message ?? '');
      }
    });

    ws.on('close', () => {
      connected = false;
      for (const [id, cb] of pending) {
        clearTimeout(cb.timer);
        cb.reject(new Error('RCON connection closed'));
        pending.delete(id);
      }
      console.warn('[RCON] Connection closed. Reconnecting...');
      scheduleReconnect();
    });
  });
}

function scheduleReconnect() {
  if (reconnecting) return;
  reconnecting = true;
  setTimeout(async () => {
    reconnecting = false;
    try {
      await connect();
    } catch (err) {
      console.error('[RCON] Reconnect failed:', err.message);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
      scheduleReconnect();
    }
  }, reconnectDelay);
}

function send(command) {
  if (!connected || !ws) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`RCON timeout: ${command}`));
    }, COMMAND_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ Identifier: id, Message: command, Type: 'Generic' }));
  }).catch((err) => {
    console.error(`[RCON] Command failed (${command}):`, err.message);
    return null;
  });
}

async function getServerStatus() {
  const response = await send('status');
  if (!response) return null;
  // "players : 5 (200 max) (0 queued) (0 joining)"
  const match = response.match(/players\s*:\s*(\d+)\s*\((\d+)\s*max\)/i);
  if (!match) {
    console.warn('[RCON] Could not parse player count. Response:', response);
    return null;
  }
  return { players: parseInt(match[1], 10), maxPlayers: parseInt(match[2], 10) };
}

async function setMaxPlayers(slots) {
  const result = await send(`server.maxplayers ${slots}`);
  if (result !== null) console.log(`[RCON] Set maxplayers to ${slots}.`);
}

function disconnect() {
  if (ws) {
    ws.removeAllListeners('close');
    ws.close();
    ws = null;
    connected = false;
  }
}

function isConnected() {
  return connected;
}

module.exports = { connect, isConnected, getServerStatus, setMaxPlayers, disconnect };
