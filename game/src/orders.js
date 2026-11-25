// The order board: spawning orders, ticking their patience, and serving.
import {
  MAX_ORDERS_ON_BOARD,
  RECIPES,
  RECIPE_ORDER,
  patienceSeconds,
  servePayout,
  spawnIntervalSeconds,
} from './config.js';

/** A single dish slot inside an order (a double order has two). */
function makeDishSlot(recipeId) {
  return { recipeId, served: false };
}

/** Spawn one order on the board, if there is room. */
export function spawnOrder(game) {
  if (game.orders.length >= MAX_ORDERS_ON_BOARD) return false;
  const doubleChance = game.day >= 2 ? 0.3 : 0;
  const isDouble = game.rng.next() < doubleChance;
  const first = game.rng.pick(RECIPE_ORDER);
  const second = game.rng.pick(RECIPE_ORDER);
  const patience = patienceSeconds(game.day, game.upgrades.patience);
  const order = {
    id: game.nextOrderId,
    dishes: isDouble ? [makeDishSlot(first), makeDishSlot(second)] : [makeDishSlot(first)],
    patience,
    patienceMax: patience,
  };
  game.nextOrderId += 1;
  game.orders.push(order);
  return true;
}

/** Advance the board: new orders arrive, patience runs out. */
export function tickOrders(game, dt) {
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    if (spawnOrder(game)) game.spawnIn = spawnIntervalSeconds(game.day);
    else game.spawnIn = 2;
  }
  for (let i = game.orders.length - 1; i >= 0; i -= 1) {
    const order = game.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      game.orders.splice(i, 1);
      game.stats.missed += 1;
      game.stats.missedToday += 1;
      game.hearts -= 1;
      game.message = 'Order walked out! −1 ❤️';
      game.messageUntil = game.time + 2.5;
    }
  }
}

/** The earliest open order (or open slot of a double order) wanting this dish. */
export function findOrderForDish(game, recipeId) {
  for (const order of game.orders) {
    for (const dish of order.dishes) {
      if (!dish.served && dish.recipeId === recipeId) return { order, dish };
    }
  }
  return null;
}

/** Serve a finished dish to its order. Returns the coins paid, or 0. */
export function serveDish(game, recipeId) {
  const found = findOrderForDish(game, recipeId);
  if (!found) return 0;
  const { order, dish } = found;
  dish.served = true;
  const recipe = RECIPES[recipeId];
  const coins = servePayout(recipe, order.patience, game.upgrades.spatula);
  game.coins += coins;
  game.score += coins;
  game.stats.served += 1;
  game.stats.servedToday += 1;
  game.stats.earned += coins;
  game.stats.earnedToday += coins;
  if (order.dishes.every((d) => d.served)) {
    game.orders.splice(game.orders.indexOf(order), 1);
  }
  return coins;
}
