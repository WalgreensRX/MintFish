require('dotenv').config();

const rcon = require('./src/rcon');
const bot = require('./src/bot');

const required = ['DISCORD_TOKEN', 'RCON_HOST', 'RCON_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

async function main() {
  console.log('[Main] Connecting to RCON...');
  await rcon.connect();

  console.log('[Main] Starting Discord bot...');
  await bot.start();
}

async function shutdown() {
  console.log('\n[Main] Shutting down...');
  bot.stop();
  await rcon.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('[Main] Fatal error:', err);
  process.exit(1);
});
