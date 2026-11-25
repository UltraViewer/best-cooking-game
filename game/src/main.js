// Boot and the one loop: input is routed every click, the kitchen advances in
// small steps, and the renderer paints what is there. The game moves between
// menu, play, paused, shop, day-end and game-over screens.
//
// ?seed=N fixes the order pattern. ?shot=menu|kitchen|shop|serve (with &seed=N)
// stages that scene instead of running the loop, paints it once and sets
// window.__shotReady for a screenshot.
import { createRandom } from './random.js';
import { createGame, endDay, endRun } from './state.js';
import { tickOrders } from './orders.js';
import { tickBurners } from './kitchen.js';
import { createSound } from './sound.js';
import { createRenderer } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const game = createGame(createRandom(seed));
const sound = createSound();
const renderer = createRenderer();

function refresh() {
  renderer.renderAll(game);
}

bindInput(game, sound, refresh);

if (shot) {
  // A staged scene: paint once, freeze the clock, signal the screenshot.
  stageShot(shot, game);
  refresh();
  window.__shotReady = true;
} else {
  game.screen = 'menu';
  refresh();
  let last = performance.now();
  let lastSignature = '';
  /** Rebuild the kitchen only when something structural changed. */
  function signature() {
    return [
      game.screen,
      game.orders.length,
      game.hearts,
      game.plate.length,
      game.burners.map((b) => b.state).join(','),
      game.chopping ? game.chopping.done : -1,
      game.hand ? `${game.hand.ing}:${game.hand.prep}` : '',
      game.coins,
    ].join('|');
  }
  function frame(now) {
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    game.time += dt;
    if (game.screen === 'play') {
      game.dayTimeLeft -= dt;
      tickOrders(game, dt);
      const burnerEvent = tickBurners(game, dt);
      if (burnerEvent === 'ready') {
        sound.ready();
        game.message = 'Something is ready on the stove!';
        game.messageUntil = game.time + 2;
      }
      if (burnerEvent === 'burnt') {
        sound.burnt();
        game.message = 'Burnt! Click the burner to bin it.';
        game.messageUntil = game.time + 2.5;
      }
      if (game.hearts <= 0) endRun(game);
      else if (game.dayTimeLeft <= 0) endDay(game);
    }
    const sig = signature();
    if (sig !== lastSignature) {
      lastSignature = sig;
      refresh();
    }
    renderer.tickVisuals(game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
