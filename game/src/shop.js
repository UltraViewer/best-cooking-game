// The shop: upgrades bought with coins between days (or mid-day, paused).
import { UPGRADES, UPGRADE_ORDER } from './config.js';

/** Cost of the next level, or null when maxed out. */
export function upgradeCost(game, key) {
  const def = UPGRADES[key];
  const level = game.upgrades[key];
  if (level >= def.max) return null;
  return def.costs[level];
}

/** Buy one level. Returns true when the coins covered it. */
export function buyUpgrade(game, key) {
  const cost = upgradeCost(game, key);
  if (cost === null || game.coins < cost) return false;
  game.coins -= cost;
  game.upgrades[key] += 1;
  if (key === 'pan') {
    while (game.burners.length < 2 + game.upgrades.pan) {
      game.burners.push({ item: null, progress: 0, state: 'empty' });
    }
  }
  return true;
}

/** Every upgrade with its level and next cost, for the shop screen. */
export function shopList(game) {
  return UPGRADE_ORDER.map((key) => {
    const def = UPGRADES[key];
    return {
      ...def,
      level: game.upgrades[key],
      cost: upgradeCost(game, key),
    };
  });
}
