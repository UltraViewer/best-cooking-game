# Sizzle & Serve — a warung kitchen rush

[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/UltraViewer/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/UltraViewer/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete cooking game that plays offline in a desktop browser from its own
files. You run a warung kitchen: orders fly onto the board, you chop, cook,
plate and serve before the customers' patience runs out, then spend the day's
coins in the shop on sharper knives, more burners, patient customers and a
golden spatula.

## The game

- **Two recipes:** Nasi Goreng (fried rice + fried egg + chopped chili) and
  Mie Ayam (boiled noodles + chopped chicken + chopped greens + broth).
- **A working menu** with the recipes, the rules and the best score.
- **A kitchen in full:** an order board with patience bars, a pantry of seven
  ingredients, a chopping board, a stove with up to four burners, a plating
  counter and a serve window — plus a day timer, coins, hearts and score.
- **A shop for upgrades** between days (and mid-day, paused): Sharp Knife,
  Big Pan, Patient Customers, Golden Spatula.
- **Pressure that grows:** days last 90 seconds, orders arrive faster, patience
  shrinks, and from day 2 some tickets ask for two dishes at once. Miss three
  orders and the run ends.
- Mouse and keyboard: click the stations, or keys 1–7 for ingredients, C to
  chop, B for the stove, P to plate, S to serve, T to trash, Esc to pause.

## Play it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome. No network request, no build
step, no assets beyond the files under `game/`. Sounds are synthesised with
WebAudio at run time.

## The program

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored make.fun
library (`vendor/makefun-game.ts`, the kit's copy unchanged). Screenshots are
real renders of the game's own code, staged deterministically with
`?shot=menu|kitchen|shop|serve&seed=1` (see `shots.json`).

## make.fun

Built for the make.fun bounty
[best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137).
