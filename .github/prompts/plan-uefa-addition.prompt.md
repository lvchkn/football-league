# Plan: Implement UEFA European Competitions with Swiss Format

## TL;DR
Add Champions League, Europa League, and Conference League as new competition options. Implement the 36-team Swiss-system format (8 rounds) → Play-offs (16 teams) → Knockout, reusing your existing multi-league architecture with a new "phase" system to track competition stage.

---

### **Steps**

Create a new folder [scripts/uefa/](scripts/uefa/) to house all UEFA-related logic, keeping it organized and modular. This will allow us to implement the unique Swiss format and phase progression without cluttering existing league code.

**Phase 1: Data Structure Foundation**
1. Create [scripts/uefa/teams.js](scripts/uefa/teams.js) — add 36-team rosters for UCL, EL, Conference League
2. Create [scripts/uefa/fixtures.js](scripts/uefa/fixtures.js) — create new generators:
   - Swiss format (8 rounds, Swiss pairings system)
   - Playoff bracket generator (16→8 teams)
   - Knockout bracket generator (traditional two-leg ties)
3. Create [scripts/uefa/table.js](scripts/uefa/table.js) — add Swiss tiebreaker logic (head-to-head comparisons first) - possibly reuse existing logic from [scripts/table.js](scripts/table.js) with modifications for Swiss format

**Phase 2: Storage & State Management**
1. Create [scripts/uefa/storage.js](scripts/uefa/storage.js) — track competition phase:
   - `competition-phase:{league}` (swiss | playoffs | knockout)  
   - `current-round:{league}` (track round within Swiss stage)
   - `qualified-teams:{league}` (teams advancing to next phase)
2. Extend [scripts/uefa/table.js](scripts/uefa/table.js) — add phase-specific qualifying logic (top 8 Swiss → playoffs)

**Phase 3: UI & Phase Progression**
1. Create [scripts/uefa/ui.js](scripts/uefa/ui.js) — render phase indicator, playoff pairings, knockout structure
2. Extend [scripts/app.js](scripts/app.js) — add `progressCompetition()` method to auto-advance Swiss→Playoffs→Knockout when rounds complete. Also add league selection dropdown for UCL, EL, Conference League in [index.html](index.html) and handle in app logic. I'd like the dropdown to have the three competitions listed under a "UEFA Competitions" section for clarity. Place the existing league options (Premier League, La Liga, etc.) in a separate section above it called "Domestic Leagues" to maintain organization.

**Phase 4: Team Data**  
1. Don't bother with real team names/logos for now—use placeholders (Team 1, Team 2, etc.) to focus on functionality. We can always add real data later if desired.

**Phase 5: Testing & Refinement**
1. Verify Swiss system: 8 rounds, no duplicate pairings, all teams play 8 opponents
2. Test phase transitions: Swiss completion → Playoffs → Knockout
3. Confirm persistence across league switches and page reloads

---

### **Further Considerations**
1. **UI Complexity** — Knockout bracket rendering could get complex. Start with linear fixture view, upgrade to graphical bracket if needed.
2. **Two-Leg Tie Data** — Confirm structure can handle "Leg 1" vs "Leg 2" labeling in UI.
