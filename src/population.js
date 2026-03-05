// Stepped scaling: targetSlots = minPop + floor(players / stepSize) * increment
// A maxplayers command is only sent when the target value changes.

const config = {
  get minPop()    { return Number(process.env.POP_MIN)       || 50;  },
  get maxPop()    { return Number(process.env.POP_MAX)       || 200; },
  get stepSize()  { return Number(process.env.POP_STEP_SIZE) || 10;  },
  get increment() { return Number(process.env.POP_INCREMENT) || 25;  },
};

let trackedMax = null;

function computeTarget(currentPlayers) {
  const { minPop, maxPop, stepSize, increment } = config;
  const target = minPop + Math.floor(currentPlayers / stepSize) * increment;
  return Math.min(Math.max(target, minPop), maxPop);
}

function tick(currentPlayers) {
  const targetSlots = computeTarget(currentPlayers);
  const changed = targetSlots !== trackedMax;

  if (changed) {
    const prev = trackedMax !== null ? ` (was ${trackedMax})` : ' (initial)';
    console.log(`[Pop] ${currentPlayers} players → ${targetSlots} slots${prev}`);
    trackedMax = targetSlots;
  }

  return { targetSlots, changed };
}

function reset() {
  trackedMax = null;
}

module.exports = { tick, reset, computeTarget };
