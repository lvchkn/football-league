# Fantasy League Simulator

A lightweight, browser-based multi-league football simulator. Choose from a variety of top European leagues, generate fixtures for a round-robin tournament, enter match results, and watch the standings update in real-time. All results persist automatically per league via browser localStorage.

## Features

- **Multiple Leagues**: Switch between several European leagues, including the English Premier League, Spanish La Liga, Italian Serie A, German Bundesliga, French Ligue 1, and more.
- **Round-robin Fixture Generation**: Automatically generates a double round-robin schedule for the selected league's teams (uses the circle method for fair pairings).
- **Real-time Standings**: The league table updates instantly as you enter and apply match results, sorted by points, goal difference (GD), and goals for (GF).
- **Persistent Progress**: Scores and fixtures are automatically saved to browser storage for each league independently. Your progress is preserved even after a page reload.
- **Flexible Controls**:
    - **Save**: Manually force an immediate save of all current results.
    - **Reset scores**: Clear all match results for the current league while keeping the fixture list.
    - **Regenerate fixtures**: Scramble the teams and generate a completely new schedule.
- **Enhanced Navigation**: A "Scroll to top" button helps you navigate quickly through long fixture lists.
- **No Backend Required**: Runs entirely in the browser using vanilla JavaScript and CSS.

## How to Use

1. **Open `index.html`** in any modern web browser.
2. **Select a League**: Use the dropdown menu at the top to choose your preferred European league.
3. **Manage Fixtures**:
    - The app generates a full schedule based on the teams defined in [`scripts/teams.js`](./scripts/teams.js).
    - Use the **Regenerate fixtures** button if you want to start with a fresh, randomized schedule.
4. **Enter Results**:
    - For each matchday, enter goals for the home and away teams in the numeric fields.
    - Click **Apply result** to record an individual match.
    - Click **Apply all results** at the bottom of a matchday to submit all scores for that round at once.
5. **Monitor Standings**: Watch the "Standings" table on the left (or top on narrow screens) to see how results affect team rankings.
6. **Saving & Resetting**:
    - Results are automatically saved (debounced), but you can use the **Save** button for peace of mind.
    - Use **Reset scores** to wipe the slate clean for the current league.
7. **Quick Navigation**: Use the "↑" button in the bottom-right corner to jump back to the standings at any time.

## Project Structure

- `index.html`: Main entry point and UI structure.
- `styles.css`: Styling with support for dynamic UI elements.
- `scripts/`:
  - `app.js`: Main application entry point and state orchestration.
  - `teams.js`: Curated lists of teams for various European leagues (as of 2025/2026 season).
  - `fixtures.js`: Logic for generating round-robin schedules.
  - `table.js`: Standings calculation and sorting logic.
  - `ui.js`: DOM manipulation and UI event handling.
  - `storage.js`: localStorage-based persistence logic.
