# Fantasy League Simulator

A simple, lightweight, browser-based multi-league football simulator. Choose from a variety of top European leagues or UEFA competitions, generate fixtures for a round-robin tournament, enter match results, and watch the standings update in real-time. All results persist automatically per league and competition via browser localStorage.

## Features

- **Multiple Competitions**: Switch between several European leagues (English Premier League, Spanish La Liga, Italian Serie A, German Bundesliga, etc.) as well as UEFA competitions.
- **Round-robin Fixture Generation**: Automatically generates a double round-robin schedule for the selected league's teams (uses the circle method for fair pairings).
- **Real-time Standings**: The league table updates instantly as you enter and apply match results.
- **Persistent Progress**: Scores and fixtures are automatically saved to browser storage for each league independently. Your progress is preserved even after a page reload.
- **Flexible Controls**:
    - **Save**: Manually force an immediate save of all current results.
    - **Reset scores**: Clear all match results for the current league while keeping the fixture list.
    - **Regenerate fixtures**: Scramble the teams and generate a completely new schedule.
- **Enhanced Navigation**: A "Scroll to top" button helps you navigate quickly through long fixture lists.

## How to Use

1. **Install Dependencies**: Run `pnpm install` in the project root.
2. **Build the project**: Run `pnpm run build` to build the project.
3. **Start Dev Server**: Run `pnpm run dev` to start the local Vite development server and open the provided URL.
4. **Select a League**: Use the dropdown menu at the top to choose your preferred domestic European league or UEFA competition.
5. **Manage Fixtures**:
    - The app generates a full schedule based on the teams defined in `src/domestic/teams.ts` and `src/uefa/teams.ts`.
    - Use the **Regenerate fixtures** button if you want to start with a fresh, randomized schedule.
6. **Enter Results**:
    - For each matchday, enter goals for the home and away teams in the numeric fields.
    - Click **Apply result** to record an individual match.
    - Click **Apply all results** at the bottom of a matchday to submit all scores for that round at once.
7. **Monitor Standings**: Watch the "Standings" table on the left (or top on narrow screens) to see how results affect team rankings.
8. **Saving & Resetting**:
    - Results are automatically saved (debounced), but you can use the **Save** button for peace of mind.
    - Use **Reset scores** to wipe the slate clean for the current league/competition.
9. **Quick Navigation**: Use the "↑" button in the bottom-right corner to jump back to the standings at any time.

## Project Structure

- `index.html`: Main entry point and UI structure.
- `styles.css`: Styling with support for dynamic UI elements.
- `src/`: Contains TypeScript source files.
  - `app.ts`: Main application entry point.
  - `interfaces/`: Shared interfaces.
  - `domestic/`: Logic for domestic leagues.
  - `uefa/`: Logic for UEFA cup structures.
  - `utils/`: Common utilities and shared logic.
- `vite.config.ts`: Configuration for Vite development and build.
- `wrangler.jsonc`: Cloudflare Pages deployment configuration.
  
