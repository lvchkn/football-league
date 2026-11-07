# Fantasy League Simulator

A lightweight browser-based football simulator. Pick a domestic league, a UEFA club competition or a national-team tournament, enter or simulate results, and follow the standings. Progress is saved per competition in localStorage.

## Competitions

- **Domestic leagues**: top flights and second tiers of major European leagues, played as a double round-robin.
- **UEFA club competitions** (Champions, Europa, Conference League): 36-team league phase, knockout playoffs, two-legged ties up to the semi-finals, and a single-match final.
- **FIFA World Cup 2026**: 12 groups of four, best eight third-placed teams, round of 32 to the final.
- **UEFA Euro 2024**: 6 groups of four, best four third-placed teams, round of 16 to the final.

Both national-team tournaments use the real groups and the official brackets, including the regulations' tables that decide which group winner each third-placed team plays.

## Features

- **Results**: enter scores per match or per matchday. A drawn knockout tie is decided by a penalty shootout.
- **Simulation**: fill a matchday or all remaining matches with random scores. Home sides get a small edge, and in UEFA and national-team competitions stronger seeds win more often.
- **Standings**: live tables with head-to-head tie-breakers, last-five form, and group tables with a third-placed ranking.
- **Team view**: click a team for its results, home/away record and head-to-head record.
- **Stage history**: browse completed stages of a tournament.
- **Controls**: Save, Reset scores (keeps fixtures), Regenerate fixtures (reshuffles fixtures; for national teams, makes a new group draw under the real draw rules).

## Getting started

```sh
pnpm install
pnpm test     # run unit tests
pnpm build    # type-check and build
pnpm dev      # start the Vite dev server
```

## Project structure

- `src/app.ts`: entry point; switches between competitions.
- `src/domestic/`: domestic leagues.
- `src/uefa/`: tournament app for stage-based competitions, plus UEFA club formats and teams.
- `src/national/`: World Cup 2026 and Euro 2024 data and formats.
- `src/tournament-format.ts`: stage-based format definitions.
- `src/utils/`: group, knockout, simulation and stats logic.
- `src/team-detail.ts`, `src/simulation-controls.ts`: shared UI.
- `wrangler.jsonc`: Cloudflare deployment config.
