// The stations: pantry, chopping board, stove, plate, trash and the serve
// window. Every action answers at once or says why it cannot.
import { BURN_WINDOW_SECONDS, INGREDIENTS, RECIPES, RECIPE_ORDER, chopsNeeded } from './config.js';
import { findOrderForDish, serveDish } from './orders.js';

/** What a carried item is: { ing, prep } with prep raw | chopped | cooked | burnt. */
export function takeIngredient(game, ingId) {
  if (game.hand) return 'Hands full — serve or trash what you hold first.';
  if (game.screen !== 'play') return null;
  game.hand = { ing: ingId, prep: 'raw' };
  return null;
}

/** One chop on the board. Needs a choppable raw item in hand. */
export function chopAtBoard(game) {
  if (game.screen !== 'play') return null;
  if (!game.hand) return 'Pick up something to chop first.';
  const def = INGREDIENTS[game.hand.ing];
  if (game.hand.prep !== 'raw' || def.prep !== 'chop') return 'This does not need chopping.';
  if (!game.chopping || game.chopping.ing !== game.hand.ing) {
    game.chopping = { ing: game.hand.ing, done: 0, needed: chopsNeeded(game.hand.ing, game.upgrades.knife) };
  }
  game.chopping.done += 1;
  if (game.chopping.done >= game.chopping.needed) {
    game.hand = { ing: game.hand.ing, prep: 'chopped' };
    game.chopping = null;
    return 'chopped';
  }
  return 'chop';
}

/** Put the raw item in hand onto a free burner. */
export function startCook(game, burnerIndex) {
  if (game.screen !== 'play') return null;
  const burner = game.burners[burnerIndex];
  if (!burner) return null;
  if (burner.state === 'ready') return takeBurner(game, burnerIndex);
  if (burner.state === 'burnt') {
    burner.item = null;
    burner.progress = 0;
    burner.state = 'empty';
    return 'Burnt food binned. The burner is free again.';
  }
  if (burner.state === 'cooking') return 'Still cooking — wait for the ding.';
  if (!game.hand) return 'Pick up something to cook first.';
  const def = INGREDIENTS[game.hand.ing];
  if (game.hand.prep !== 'raw' || def.prep !== 'cook') return 'This does not go on the stove.';
  burner.item = { ing: game.hand.ing, prep: 'raw' };
  burner.progress = 0;
  burner.state = 'cooking';
  game.hand = null;
  return 'cooking';
}

/** Lift a finished dish off a burner into the hand. */
export function takeBurner(game, burnerIndex) {
  const burner = game.burners[burnerIndex];
  if (!burner || burner.state !== 'ready') return null;
  if (game.hand) return 'Hands full — serve or trash what you hold first.';
  game.hand = { ing: burner.item.ing, prep: 'cooked' };
  burner.item = null;
  burner.progress = 0;
  burner.state = 'empty';
  return 'cooked';
}

/** Advance every burner one step; returns 'ready' when one finishes, 'burnt' when one burns. */
export function tickBurners(game, dt) {
  let event = null;
  for (const burner of game.burners) {
    if (burner.state !== 'cooking' && burner.state !== 'ready') continue;
    const def = INGREDIENTS[burner.item.ing];
    burner.progress += dt;
    if (burner.state === 'cooking' && burner.progress >= def.cookSeconds) {
      burner.state = 'ready';
      burner.progress = def.cookSeconds;
      event = 'ready';
    } else if (burner.state === 'ready' && burner.progress >= def.cookSeconds + BURN_WINDOW_SECONDS) {
      burner.state = 'burnt';
      event = 'burnt';
    }
  }
  return event;
}

/** Does the plate, plus one more item, stay inside some recipe? */
function plateStaysPossible(plate, extra) {
  const combo = [...plate, extra];
  return RECIPE_ORDER.some((recipeId) => {
    const needs = RECIPES[recipeId].needs;
    if (combo.length > needs.length) return false;
    const remaining = needs.map((n) => `${n.ing}:${n.prep}`);
    for (const item of combo) {
      const key = `${item.ing}:${item.prep}`;
      const at = remaining.indexOf(key);
      if (at === -1) return false;
      remaining.splice(at, 1);
    }
    return true;
  });
}

/** The recipe the plate exactly matches, or null. */
export function plateRecipeId(game) {
  for (const recipeId of RECIPE_ORDER) {
    const needs = RECIPES[recipeId].needs;
    if (needs.length !== game.plate.length) continue;
    const remaining = needs.map((n) => `${n.ing}:${n.prep}`);
    let ok = true;
    for (const item of game.plate) {
      const at = remaining.indexOf(`${item.ing}:${item.prep}`);
      if (at === -1) { ok = false; break; }
      remaining.splice(at, 1);
    }
    if (ok) return recipeId;
  }
  return null;
}

/** Drop the item in hand onto the plate. */
export function addHandToPlate(game) {
  if (game.screen !== 'play') return null;
  if (!game.hand) return 'Pick up a prepared ingredient first.';
  if (game.hand.prep === 'burnt') return 'Burnt food goes in the trash, not on a plate.';
  if (!plateStaysPossible(game.plate, game.hand)) {
    return 'That does not fit any recipe — trash the plate to start over.';
  }
  game.plate.push(game.hand);
  game.hand = null;
  const done = plateRecipeId(game);
  if (done) return `dish-ready:${done}`;
  return 'plated';
}

/** Trash what is in hand, or clear the plate when the hand is empty. */
export function trash(game) {
  if (game.screen !== 'play') return null;
  if (game.hand) {
    game.hand = null;
    game.chopping = null;
    return 'Binned.';
  }
  if (game.plate.length > 0) {
    game.plate = [];
    return 'Plate cleared.';
  }
  return 'Nothing to bin.';
}

/** Serve the finished plate at the window. Returns coins paid, or a message. */
export function serveWindow(game) {
  if (game.screen !== 'play') return null;
  const recipeId = plateRecipeId(game);
  if (!recipeId) return 'The plate is not a finished dish yet.';
  const found = findOrderForDish(game, recipeId);
  if (!found) return `Nobody ordered ${RECIPES[recipeId].name} right now.`;
  const coins = serveDish(game, recipeId);
  game.plate = [];
  return { coins, recipeId };
}
