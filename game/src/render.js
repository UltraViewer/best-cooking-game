// Painting the kitchen: builds the dynamic sections from state and patches
// the timers every frame without rebuilding the buttons under the cursor.
import {
  DAY_LENGTH_SECONDS,
  INGREDIENTS,
  PANTRY_ORDER,
  RECIPES,
  UPGRADE_ORDER,
} from './config.js';
import { plateRecipeId } from './kitchen.js';
import { shopList } from './shop.js';

function fmtClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function itemLabel(item) {
  const def = INGREDIENTS[item.ing];
  const prep = item.prep === 'raw' ? '' : item.prep === 'chopped' ? ' (chopped)' : item.prep === 'cooked' ? ' (cooked)' : ' (burnt)';
  return `${def.emoji} ${def.name}${prep}`;
}

export function createRenderer() {
  const $ = (id) => document.getElementById(id);

  function renderHud(game) {
    $('hud-day').textContent = `Day ${game.day}`;
    $('hud-coins').textContent = `🪙 ${game.coins}`;
    $('hud-hearts').textContent = '❤️'.repeat(Math.max(0, game.hearts)) + '🖤'.repeat(Math.max(0, 3 - game.hearts));
    $('hud-score').textContent = `Score ${game.score}`;
    $('btn-sound').textContent = game.muted ? '🔇' : '🔊';
    $('menu-best').textContent = game.best;
  }

  function renderOrders(game) {
    const board = $('orders');
    if (game.orders.length === 0) {
      board.innerHTML = '<div class="no-orders">No orders yet — the lunch rush is coming…</div>';
      return;
    }
    board.innerHTML = game.orders.map((order) => {
      const dishes = order.dishes.map((dish) => {
        const recipe = RECIPES[dish.recipeId];
        const chips = recipe.needs.map((need) => {
          const have = game.plate.some((p) => p.ing === need.ing && p.prep === need.prep);
          const def = INGREDIENTS[need.ing];
          return `<span class="chip${have ? ' done' : ''}">${def.emoji}${have ? ' ✓' : ''}</span>`;
        }).join('');
        return `<div class="ticket-dish${dish.served ? ' served' : ''}">
          <span class="ticket-name">${recipe.emoji} ${recipe.name}</span>
          <span class="ticket-needs">${chips}</span>
          ${dish.served ? '<span class="ticket-served">✓ served</span>' : ''}
        </div>`;
      }).join('');
      const pct = Math.max(0, (order.patience / order.patienceMax) * 100);
      const urgent = pct < 35 ? ' urgent' : '';
      return `<div class="ticket${urgent}" data-order="${order.id}">
        ${dishes}
        <div class="patience"><i id="patience-${order.id}" style="width:${pct}%"></i></div>
        <div class="ticket-pay">pays ${order.dishes.map((d) => RECIPES[d.recipeId].payout).reduce((a, b) => a + b, 0)} 🪙</div>
      </div>`;
    }).join('');
  }

  function renderPantry(game) {
    $('pantry-items').innerHTML = PANTRY_ORDER.map((ingId, i) => {
      const def = INGREDIENTS[ingId];
      const prepNote = def.prep === 'chop' ? '🔪 chop' : def.prep === 'cook' ? '🔥 cook' : '✓ ready';
      return `<button class="ing" data-action="take" data-ing="${ingId}" ${game.hand ? 'disabled' : ''}>
        <span class="ing-emoji">${def.emoji}</span>
        <span class="ing-name">${def.name}</span>
        <span class="ing-prep">${prepNote}</span>
        <span class="ing-key">${i + 1}</span>
      </button>`;
    }).join('');
  }

  function renderBoard(game) {
    const board = $('board');
    if (game.chopping) {
      const def = INGREDIENTS[game.chopping.ing];
      board.innerHTML = `<button class="board-btn" data-action="chop">
        <span class="board-emoji">${def.emoji}</span>
        <div class="board-progress"><i style="width:${(game.chopping.done / game.chopping.needed) * 100}%"></i></div>
        <span class="board-text">Chopping… ${game.chopping.done}/${game.chopping.needed} — click again!</span>
      </button>`;
    } else {
      board.innerHTML = '<button class="board-btn" data-action="chop"><div class="board-empty">Empty board.<br>Pick up chili, chicken or greens, then click here to chop.</div></button>';
    }
  }

  function renderBurners(game) {
    $('burners').innerHTML = game.burners.map((burner, i) => {
      if (burner.state === 'empty') {
        return `<button class="burner empty" data-action="burner" data-burner="${i}">
          <span class="burner-emoji">○</span><span class="burner-label">Burner ${i + 1} — empty</span>
        </button>`;
      }
      const def = INGREDIENTS[burner.item.ing];
      const total = def.cookSeconds;
      const pct = Math.min(100, (burner.progress / total) * 100);
      const label = burner.state === 'cooking' ? `Cooking… ${Math.ceil(total - burner.progress)}s`
        : burner.state === 'ready' ? 'READY — click to take!'
        : 'BURNT! Click to bin it.';
      return `<button class="burner ${burner.state}" data-action="burner" data-burner="${i}">
        <span class="burner-emoji">${def.emoji}</span>
        <span class="burner-progress"><i style="width:${pct}%"></i></span>
        <span class="burner-label">${label}</span>
      </button>`;
    }).join('');
  }

  function renderPlate(game) {
    const done = plateRecipeId(game);
    const slots = [0, 1, 2, 3].map((i) => {
      const item = game.plate[i];
      return item
        ? `<span class="plate-slot filled">${INGREDIENTS[item.ing].emoji}</span>`
        : '<span class="plate-slot"></span>';
    }).join('');
    const banner = done
      ? `<div class="plate-done">✨ ${RECIPES[done].emoji} ${RECIPES[done].name} — ready! Serve it →</div>`
      : `<div class="plate-hint">${game.plate.length === 0 ? 'Empty plate — add prepared ingredients.' : 'Keep adding — the ticket shows what is missing.'}</div>`;
    $('plate').innerHTML = `<button class="plate-btn" data-action="plate">${slots}${banner}</button>`;
  }

  function renderServe(game) {
    const done = plateRecipeId(game);
    $('serve').innerHTML = `<button class="serve-btn${done ? ' ready' : ''}" data-action="serve">
      <span class="serve-emoji">🛎️</span>
      <span class="serve-label">${done ? `Serve ${RECIPES[done].name}!` : 'Serve window'}</span>
      ${game.serveFlash ? `<span class="serve-flash">${game.serveFlash}</span>` : ''}
    </button>`;
  }

  function renderHand(game) {
    $('hand').innerHTML = game.hand
      ? `🤲 Hand: <b>${itemLabel(game.hand)}</b>`
      : '🤲 Hand: <b>empty</b>';
    $('btn-trash').disabled = !game.hand && game.plate.length === 0;
  }

  function renderMessage(game) {
    $('message').textContent = game.message;
    $('message').classList.toggle('show', game.message !== '');
  }

  function renderShop(game) {
    $('shop-coins').textContent = `🪙 ${game.coins}`;
    // Between days the shop leads onward; mid-day it just leads back.
    $('shop-next').classList.toggle('hidden', game.screenBeforeShop !== 'dayend');
    $('shop-back').classList.toggle('hidden', game.screenBeforeShop === 'dayend');
    if (game.screenBeforeShop === 'dayend') {
      $('shop-next').textContent = `Start Day ${game.day + 1} ▶`;
    }
    $('shop-items').innerHTML = shopList(game).map((up) => {
      const owned = up.level >= up.max;
      const afford = up.cost !== null && game.coins >= up.cost;
      return `<div class="shop-item">
        <div class="shop-emoji">${up.emoji}</div>
        <div class="shop-info"><b>${up.name}</b> <span class="shop-level">${'★'.repeat(up.level)}${'☆'.repeat(up.max - up.level)}</span>
        <p>${up.desc}</p></div>
        <button class="shop-buy" data-action="buy" data-key="${up.id}" ${owned || !afford ? 'disabled' : ''}>
          ${owned ? 'MAXED' : `${up.cost} 🪙`}
        </button>
      </div>`;
    }).join('');
  }

  function renderDayEnd(game) {
    const r = game.dayResults;
    if (!r) return;
    $('dayend-body').innerHTML = `
      <p class="dayend-line">Day ${r.day} is done!</p>
      <p>🍽️ Served <b>${r.served}</b> · 🚶 Missed <b>${r.missed}</b> · 🪙 Earned <b>${r.earned}</b></p>
      <p>Your purse: <b>${r.coins} 🪙</b> — spend it in the shop, then cook day ${r.day + 1}.</p>`;
  }

  function renderGameOver(game) {
    $('gameover-body').innerHTML = `
      <p>The rush beat you — all three hearts are gone.</p>
      <p>🍽️ Served <b>${game.stats.served}</b> dishes · 🪙 Earned <b>${game.stats.earned}</b></p>
      <p>Final score: <b>${game.score}</b> · Best: <b>${game.best}</b></p>`;
  }

  const OVERLAYS = {
    menu: 'overlay-menu',
    help: 'overlay-help',
    shop: 'overlay-shop',
    dayend: 'overlay-dayend',
    gameover: 'overlay-gameover',
    paused: 'overlay-pause',
  };

  function showScreen(game) {
    for (const [screen, id] of Object.entries(OVERLAYS)) {
      $(id).classList.toggle('hidden', game.screen !== screen);
    }
    $('btn-shop').disabled = game.screen !== 'play';
    $('btn-pause').disabled = game.screen !== 'play' && game.screen !== 'paused';
  }

  return {
    renderAll(game) {
      renderHud(game);
      renderOrders(game);
      renderPantry(game);
      renderBoard(game);
      renderBurners(game);
      renderPlate(game);
      renderServe(game);
      renderHand(game);
      renderMessage(game);
      renderShop(game);
      renderDayEnd(game);
      renderGameOver(game);
      showScreen(game);
      this.tickVisuals(game);
    },
    /** Cheap per-frame patch: clocks and bars only, no DOM rebuilds. */
    tickVisuals(game) {
      $('hud-clock').textContent = fmtClock(game.dayTimeLeft);
      const dayPct = Math.max(0, (game.dayTimeLeft / DAY_LENGTH_SECONDS) * 100);
      $('hud-timerbar').style.width = `${dayPct}%`;
      $('hud-timerbar').classList.toggle('urgent', dayPct < 25);
      for (const order of game.orders) {
        const bar = document.getElementById(`patience-${order.id}`);
        if (bar) bar.style.width = `${Math.max(0, (order.patience / order.patienceMax) * 100)}%`;
      }
      for (let i = 0; i < game.burners.length; i += 1) {
        const burner = game.burners[i];
        if (burner.state === 'cooking') {
          const bar = document.querySelector(`.burner[data-burner="${i}"] .burner-progress i`);
          if (bar) {
            const def = INGREDIENTS[burner.item.ing];
            bar.style.width = `${Math.min(100, (burner.progress / def.cookSeconds) * 100)}%`;
          }
        }
      }
      if (game.message && game.time > game.messageUntil) {
        game.message = '';
        $('message').textContent = '';
        $('message').classList.remove('show');
      }
    },
    popup(text) {
      const popups = $('popups');
      const el = document.createElement('div');
      el.className = 'popup';
      el.textContent = text;
      popups.appendChild(el);
      window.setTimeout(() => el.remove(), 1400);
    },
  };
}
