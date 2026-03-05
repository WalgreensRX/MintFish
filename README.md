# MintFish

A Discord bot that monitors a Rust game server and automatically scales its max player slots based on current population, using RCON over WebSocket.

## How It Works

The bot polls the Rust server via RCON at a configurable interval, reads the current player count, and dynamically adjusts `server.maxplayers` using a stepped scaling algorithm. The bot's Discord presence reflects live server status.

### Scaling Formula

```
targetSlots = POP_MIN + floor(players / POP_STEP_SIZE) * POP_INCREMENT
```

The result is clamped between `POP_MIN` and `POP_MAX`.

**Example** (defaults): With 25 players online, `50 + floor(25/10) * 25 = 100 slots`.

## Requirements

- Node.js v18+
- A Discord bot token
- A Rust server with WebSocket RCON enabled (`+rcon.web 1`)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (see [Configuration](#configuration)).

3. Start the bot:

   ```bash
   npm start
   ```

## Configuration

Create a `.env` file with the following variables:

### Required

| Variable         | Description                          |
|------------------|--------------------------------------|
| `DISCORD_TOKEN`  | Your Discord bot token               |
| `RCON_HOST`      | Rust server hostname or IP           |
| `RCON_PASSWORD`  | RCON password                        |

### Optional

| Variable            | Default                        | Description                                      |
|---------------------|--------------------------------|--------------------------------------------------|
| `RCON_PORT`         | `28016`                        | WebSocket RCON port                              |
| `POLL_INTERVAL_MS`  | `30000`                        | How often to poll the server (milliseconds)      |
| `POP_MIN`           | `50`                           | Minimum max player slots                         |
| `POP_MAX`           | `200`                          | Maximum max player slots                         |
| `POP_STEP_SIZE`     | `10`                           | Number of players per scaling step               |
| `POP_INCREMENT`     | `25`                           | Slots added per step                             |
| `STATUS_PLAYING`    | `{players} / {slots} online`   | Discord presence when server is online           |
| `STATUS_OFFLINE`    | `Server Offline`               | Discord presence when RCON is disconnected       |
| `STATUS_STARTING`   | `Server Starting...`           | Discord presence when server is not yet ready    |

### Example `.env`

```env
DISCORD_TOKEN=your_token_here
RCON_HOST=123.456.789.0
RCON_PORT=28016
RCON_PASSWORD=your_rcon_password

POLL_INTERVAL_MS=30000
POP_MIN=50
POP_MAX=200
POP_STEP_SIZE=10
POP_INCREMENT=25

STATUS_PLAYING={players} / {slots} online
STATUS_OFFLINE=Server Offline
STATUS_STARTING=Server Starting...
```

## Project Structure

```
index.js          - Entry point, startup/shutdown
src/
  bot.js          - Discord client, polling loop, presence updates
  rcon.js         - WebSocket RCON client with auto-reconnect
  population.js   - Stepped scaling logic
```
