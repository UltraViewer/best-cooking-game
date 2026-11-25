// The game's state: one plain object, created fresh for every run.
// Screens: menu | play | paused | shop | dayend | gameover | help.
import { DAY_LENGTH_SECONDS, START_HEARTS, burnerCount } from './config.js';

export function createGame(rng) {
  return {
    rng,
    screen: 'menu',
    screenBeforeShop: 'play',
    day: 1,
    dayTimeLeft: DAY_LENGTH_SECONDS,
    coins: 0,
    score: 0,
    hearts: START_HEARTS,
    best: 0,
    upgrades: { knife: 0, pan: 0, patience: 0, spatula: 0 },
    hand: null,
    chopping: null,
    burners: [],
    plate: [],
    orders: [],
    nextOrderId: 1,
    spawnIn: 5,
    muted: false,
    message: '',
    messageUntil: 0,
    serveFlash: null,
    popups: [],
    stats: { served: 0, missed: 0, earned: 0, servedToday: 0, missedToday: 0, earnedToday: 0 },
    dayResults: null,
    pausedFrom: null,
    time: 0,
  };
}

/** Fresh burners for the current pan upgrade. */
export function freshBurners(game) {
  const count = burnerCount(game.upgrades.pan);
  game.burners = Array.from({ length: count }, () => ({
    item: null,
    progress: 0,
    state: 'empty',
  }));
}

/** Wipe the per-day mess and start a day's clock. */
export function startDay(game) {
  game.dayTimeLeft = DAY_LENGTH_SECONDS;
  game.hand = null;
  game.chopping = null;
  freshBurners(game);
  game.plate = [];
  game.orders = [];
  game.spawnIn = 4;
  game.stats.servedToday = 0;
  game.stats.missedToday = 0;
  game.stats.earnedToday = 0;
  game.screen = 'play';
}

/** Close the day: keep the results for the day-end screen. */
export function endDay(game) {
  game.dayResults = {
    day: game.day,
    served: game.stats.servedToday,
    missed: game.stats.missedToday,
    earned: game.stats.earnedToday,
    coins: game.coins,
  };
  game.screen = 'dayend';
}

/** The run ends when the last heart is gone. */
export function endRun(game) {
  if (game.score > game.best) game.best = game.score;
  game.screen = 'gameover';
}
