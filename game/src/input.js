// Clicks and keys, wired by data-action. Every station answers through the
// kitchen rules; this file only routes the gesture to the rule.
import { PANTRY_ORDER } from './config.js';
import { addHandToPlate, chopAtBoard, serveWindow, startCook, takeIngredient, trash } from './kitchen.js';
import { buyUpgrade } from './shop.js';
import { endDay, startDay } from './state.js';

export function bindInput(game, sound, refresh) {
  function note(text) {
    if (!text) return;
    if (typeof text === 'string' && text.startsWith('dish-ready:')) {
      sound.ready();
      game.message = 'Dish complete — serve it at the window!';
      game.messageUntil = game.time + 3;
      return;
    }
    if (text === 'chop' || text === 'chopped') {
      if (text === 'chopped') sound.chopped();
      else sound.chop();
      refresh();
      return;
    }
    if (text === 'cooking') sound.cooking();
    if (text === 'cooked') sound.ready();
    if (text === 'plated') sound.plated();
    game.message = text;
    game.messageUntil = game.time + 2.5;
    if (text.includes('does not') || text.includes('Hands full') || text.includes('first') || text.includes('Burnt')) {
      sound.error();
    }
    refresh();
  }

  function act(action, target) {
    sound.unlock();
    if (action === 'take') {
      note(takeIngredient(game, target.dataset.ing));
      refresh();
      return;
    }
    if (action === 'chop') { note(chopAtBoard(game)); return; }
    if (action === 'burner') { note(startCook(game, Number(target.dataset.burner))); refresh(); return; }
    if (action === 'plate') { note(addHandToPlate(game)); refresh(); return; }
    if (action === 'trash') { note(trash(game)); refresh(); return; }
    if (action === 'serve') {
      const result = serveWindow(game);
      if (result && typeof result === 'object') {
        sound.coin();
        game.serveFlash = `+${result.coins} 🪙 served!`;
        window.setTimeout(() => { game.serveFlash = null; refresh(); }, 1500);
        refresh();
        return;
      }
      note(result);
      return;
    }
    if (action === 'shop') {
      if (game.screen !== 'play') return;
      game.screenBeforeShop = 'play';
      game.screen = 'shop';
      sound.click();
      refresh();
      return;
    }
    if (action === 'buy') {
      if (buyUpgrade(game, target.dataset.key)) {
        sound.coin();
        game.message = 'Upgrade bought!';
        game.messageUntil = game.time + 2;
      } else {
        sound.error();
        game.message = 'Not enough coins yet.';
        game.messageUntil = game.time + 2;
      }
      refresh();
      return;
    }
    if (action === 'close-shop') {
      game.screen = game.screenBeforeShop === 'dayend' ? 'dayend' : 'play';
      sound.click();
      refresh();
      return;
    }
    if (action === 'help') {
      game.pausedFrom = game.screen;
      game.screen = 'help';
      sound.click();
      refresh();
      return;
    }
    if (action === 'close-help') {
      game.screen = game.pausedFrom || 'menu';
      sound.click();
      refresh();
      return;
    }
    if (action === 'pause') {
      if (game.screen === 'play') { game.screen = 'paused'; sound.click(); refresh(); }
      return;
    }
    if (action === 'resume') {
      game.screen = 'play';
      sound.click();
      refresh();
      return;
    }
    if (action === 'sound') {
      sound.setMuted(!sound.isMuted());
      game.muted = sound.isMuted();
      refresh();
      return;
    }
    if (action === 'start') {
      sound.unlock();
      sound.click();
      game.day = 1;
      game.coins = 0;
      game.score = 0;
      game.hearts = 3;
      game.upgrades = { knife: 0, pan: 0, patience: 0, spatula: 0 };
      game.stats = { served: 0, missed: 0, earned: 0, servedToday: 0, missedToday: 0, earnedToday: 0 };
      game.best = game.best || 0;
      startDay(game);
      refresh();
      return;
    }
    if (action === 'next-day') {
      game.day += 1;
      game.hearts = Math.min(3, game.hearts + 1);
      game.screenBeforeShop = 'dayend';
      game.screen = 'shop';
      sound.click();
      refresh();
      return;
    }
    if (action === 'shop-to-day') {
      startDay(game);
      sound.click();
      refresh();
      return;
    }
    if (action === 'restart') {
      game.screen = 'menu';
      refresh();
      return;
    }
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    act(target.dataset.action, target);
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (game.screen === 'menu' && (key === 'enter' || key === ' ')) {
      event.preventDefault();
      act('start', document.body);
      return;
    }
    if (game.screen !== 'play') {
      if (key === 'escape' && game.screen === 'paused') act('resume', document.body);
      return;
    }
    const pantryIndex = ['1', '2', '3', '4', '5', '6', '7'].indexOf(key);
    if (pantryIndex >= 0) {
      act('take', { dataset: { ing: PANTRY_ORDER[pantryIndex] } });
      return;
    }
    if (key === 'c' || key === 'x') act('chop', document.body);
    else if (key === 'b') {
      const ready = game.burners.findIndex((b) => b.state === 'ready');
      const free = game.burners.findIndex((b) => b.state === 'empty');
      act('burner', { dataset: { burner: String(ready >= 0 ? ready : free) } });
    } else if (key === 'p') act('plate', document.body);
    else if (key === 's') act('serve', document.body);
    else if (key === 't') act('trash', document.body);
    else if (key === 'escape') act('pause', document.body);
    else if (key === 'm') act('sound', document.body);
  });
}
