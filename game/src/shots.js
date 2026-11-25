// Deterministic screenshot scenes behind ?shot=menu|kitchen|shop|serve.
// Each one stages a real game state (the same values real play would build)
// and freezes the clock, so the same seed always gives the same frame.
import { DAY_LENGTH_SECONDS, START_HEARTS } from './config.js';
import { freshBurners } from './state.js';

function basePlay(game, { day = 1, timeLeft = 72, coins = 85, score = 120, hearts = START_HEARTS } = {}) {
  game.screen = 'play';
  game.day = day;
  game.dayTimeLeft = timeLeft;
  game.coins = coins;
  game.score = score;
  game.hearts = hearts;
  game.hand = null;
  game.chopping = null;
  game.plate = [];
  game.orders = [];
  game.nextOrderId = 1;
  game.spawnIn = 6;
  freshBurners(game);
  game.time = 0;
  game.message = '';
  game.serveFlash = null;
}

export function stageShot(name, game) {
  if (name === 'kitchen') {
    basePlay(game, { timeLeft: 72, coins: 85, score: 120 });
    // Two orders on the board, one impatient: the lunch rush in full swing.
    game.orders = [
      { id: 1, dishes: [{ recipeId: 'nasi-goreng', served: false }], patience: 32, patienceMax: 45 },
      { id: 2, dishes: [{ recipeId: 'mie-ayam', served: false }], patience: 18, patienceMax: 45 },
    ];
    game.nextOrderId = 3;
    // Nasi Goreng mid-assembly on the plate (2 of 3), chicken mid-chop in hand,
    // noodles on the stove: kitchen, order board, counter, assembly, timer, plate.
    game.plate = [
      { ing: 'rice', prep: 'cooked' },
      { ing: 'egg', prep: 'cooked' },
    ];
    game.hand = { ing: 'chicken', prep: 'raw' };
    game.chopping = { ing: 'chicken', done: 2, needed: 3 };
    game.burners[0] = { item: { ing: 'noodles', prep: 'raw' }, progress: 2.2, state: 'cooking' };
    game.message = 'Chop the chicken, then finish the Nasi Goreng!';
    game.messageUntil = 999999;
    return;
  }
  if (name === 'shop') {
    basePlay(game, { timeLeft: 0, coins: 150, score: 185 });
    game.dayResults = { day: 1, served: 5, missed: 1, earned: 120, coins: 150 };
    game.upgrades = { knife: 1, pan: 0, patience: 0, spatula: 0 };
    game.screenBeforeShop = 'dayend';
    game.screen = 'shop';
    return;
  }
  if (name === 'serve') {
    basePlay(game, { timeLeft: 58, coins: 85, score: 120 });
    game.orders = [
      { id: 1, dishes: [{ recipeId: 'nasi-goreng', served: false }], patience: 25, patienceMax: 45 },
      { id: 2, dishes: [{ recipeId: 'mie-ayam', served: false }], patience: 38, patienceMax: 45 },
    ];
    game.nextOrderId = 3;
    // A finished Nasi Goreng on the plate, its ticket waiting: plate ready to serve.
    game.plate = [
      { ing: 'rice', prep: 'cooked' },
      { ing: 'egg', prep: 'cooked' },
      { ing: 'chili', prep: 'chopped' },
    ];
    game.serveFlash = 'Served! +25 🪙';
    return;
  }
  // Any other name is the menu.
  game.screen = 'menu';
  game.day = 1;
  game.coins = 0;
  game.score = 0;
  game.best = 320;
  game.time = 0;
}
