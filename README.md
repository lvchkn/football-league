# Fantasy Football League Simulator

A lightweight, browser-based fantasy football league simulator. Generate fixtures for a round-robin tournament, enter match results, and watch the league standings update in real-time. All fixture results persist automatically via browser localStorage.

## Features

- **Round-robin fixture generation**: Automatically generates a double round-robin schedule for any number of teams (uses the circle method for fair pairings).
- **Real-time standings**: League table updates instantly as you enter and apply match results, sorted by points, goal difference, and goals for.
- **Persistent results**: All match scores are automatically saved to browser storage (debounced). The data survives page reloads.
- **Save & Reset controls**: Manually save results or clear all data with dedicated buttons.
- **No backend required**: Runs entirely in the browser with vanilla JavaScript.

## How to Use

1. Open `index.html` in a browser.
2. The app generates fixtures for the teams defined in [./scripts/teams.js](./scripts/teams.js).
3. For each matchday:
    - Enter home and away team goals in the input fields.
    - Click **Apply result** to record the match and update standings.
    - Or click **Apply all results** to apply all matches in a matchday at once.
4. Click **Save** to force an immediate save (otherwise results autosave after 300ms of inactivity).
5. Click **Reset** to clear all saved results and start fresh.
6. Reload the page, your results persist.
