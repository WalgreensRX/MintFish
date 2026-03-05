const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const rcon = require('./rcon');
const pop = require('./population');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let pollTimer = null;

function formatText(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

async function poll() {
  try {
    if (!rcon.isConnected()) {
      const text = process.env.STATUS_OFFLINE || '⛔ Server Offline';
      client.user.setPresence({
        activities: [{ name: text, type: ActivityType.Watching }],
        status: 'dnd',
      });
      return;
    }

    const status = await rcon.getServerStatus();

    if (!status) {
      const text = process.env.STATUS_STARTING || '⏳ Server Starting...';
      client.user.setPresence({
        activities: [{ name: text, type: ActivityType.Watching }],
        status: 'idle',
      });
      return;
    }

    const { players } = status;
    const { targetSlots, changed } = pop.tick(players);

    if (changed) await rcon.setMaxPlayers(targetSlots);

    const template = process.env.STATUS_PLAYING || '🎮 {players} / {slots} online';
    const text = formatText(template, { players, slots: targetSlots });
    client.user.setPresence({
      activities: [{ name: text, type: ActivityType.Watching }],
      status: 'online',
    });
  } catch (err) {
    console.error('[Bot] Poll error:', err.message);
  }
}

client.once('ready', () => {
  console.log(`[Bot] Logged in as ${client.user.tag}`);
  pop.reset();
  const interval = Number(process.env.POLL_INTERVAL_MS) || 30_000;
  poll();
  pollTimer = setInterval(poll, interval);
  console.log(`[Bot] Polling every ${interval / 1000}s.`);
});

async function start() {
  await client.login(process.env.DISCORD_TOKEN);
}

function stop() {
  if (pollTimer) clearInterval(pollTimer);
  client.destroy();
}

module.exports = { start, stop };
