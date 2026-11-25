// Tuning, recipes, ingredients and upgrades for Sizzle & Serve.
// One clear job: every number the kitchen runs on lives here, so balancing
// never means hunting through game logic.
export const DAY_LENGTH_SECONDS = 90;
export const START_HEARTS = 3;
export const MAX_ORDERS_ON_BOARD = 3;
export const BURN_WINDOW_SECONDS = 6;
export const TIP_PER_FIVE_SECONDS = 1;
export const TIP_CAP = 10;

export const INGREDIENTS = {
  rice: { id: 'rice', name: 'Rice', emoji: '🍚', prep: 'cook', cookSeconds: 4 },
  egg: { id: 'egg', name: 'Egg', emoji: '🥚', prep: 'cook', cookSeconds: 3 },
  chili: { id: 'chili', name: 'Chili', emoji: '🌶️', prep: 'chop', chops: 3 },
  noodles: { id: 'noodles', name: 'Noodles', emoji: '🍜', prep: 'cook', cookSeconds: 4 },
  chicken: { id: 'chicken', name: 'Chicken', emoji: '🍗', prep: 'chop', chops: 3 },
  greens: { id: 'greens', name: 'Greens', emoji: '🥬', prep: 'chop', chops: 2 },
  broth: { id: 'broth', name: 'Broth', emoji: '🍲', prep: 'none' },
};

/** Pantry order: the order the ingredients show on the counter. */
export const PANTRY_ORDER = ['rice', 'egg', 'chili', 'noodles', 'chicken', 'greens', 'broth'];

export const RECIPES = {
  'nasi-goreng': {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    emoji: '🍳',
    payout: 25,
    needs: [
      { ing: 'rice', prep: 'cooked' },
      { ing: 'egg', prep: 'cooked' },
      { ing: 'chili', prep: 'chopped' },
    ],
  },
  'mie-ayam': {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    emoji: '🍜',
    payout: 30,
    needs: [
      { ing: 'noodles', prep: 'cooked' },
      { ing: 'chicken', prep: 'chopped' },
      { ing: 'greens', prep: 'chopped' },
      { ing: 'broth', prep: 'raw' },
    ],
  },
};

export const RECIPE_ORDER = ['nasi-goreng', 'mie-ayam'];

export const UPGRADES = {
  knife: {
    id: 'knife', name: 'Sharp Knife', emoji: '🔪',
    desc: 'Chopping takes one less click each level.',
    max: 2, costs: [40, 90],
  },
  pan: {
    id: 'pan', name: 'Big Pan', emoji: '🍳',
    desc: 'Adds one stove burner each level.',
    max: 2, costs: [60, 120],
  },
  patience: {
    id: 'patience', name: 'Patient Customers', emoji: '⏳',
    desc: 'Orders wait 10 seconds longer each level.',
    max: 3, costs: [50, 90, 150],
  },
  spatula: {
    id: 'spatula', name: 'Golden Spatula', emoji: '🥄',
    desc: 'Earn 25% more coins per serve each level.',
    max: 2, costs: [70, 130],
  },
};

export const UPGRADE_ORDER = ['knife', 'pan', 'patience', 'spatula'];

/** Chops a chop-prep ingredient needs, after the knife upgrade. */
export function chopsNeeded(ingId, knifeLevel) {
  const base = INGREDIENTS[ingId].chops;
  return Math.max(1, base - knifeLevel);
}

/** Burners on the stove, after the pan upgrade. */
export function burnerCount(panLevel) {
  return 2 + panLevel;
}

/** Seconds an order waits, after the patience upgrade and the day's rush. */
export function patienceSeconds(day, patienceLevel) {
  const rush = Math.max(0, (day - 1) * 3);
  return Math.max(30, 45 - rush) + patienceLevel * 10;
}

/** Seconds between new orders, shrinking as the days rush on. */
export function spawnIntervalSeconds(day) {
  return Math.max(6, 11 - day);
}

/** Coins a serve pays, after the spatula upgrade and the patience tip. */
export function servePayout(recipe, patienceLeft, spatulaLevel) {
  const tip = Math.min(TIP_CAP, Math.floor(patienceLeft / 5) * TIP_PER_FIVE_SECONDS);
  const base = recipe.payout + tip;
  return Math.round(base * (1 + 0.25 * spatulaLevel));
}
