import type { LeagueList } from "../interfaces/tournament.js";
import { createFixtureStore } from "../fixture-store.js";
import { getRosterVersion } from "../competitions.js";

/**
 * Domestic league persistence. Results are stored minimally: goals only,
 * or null for unplayed matches.
 */
const store = createFixtureStore({
    prefix: "football-league:",
    defaultId: "english",
    expectedVersion: (league) => getRosterVersion(league as LeagueList),
    serializeResult: (match) =>
        !match || (match.homeGoals == null && match.awayGoals == null)
            ? null
            : { homeGoals: match.homeGoals, awayGoals: match.awayGoals },
    serializeStructure: (match) => ({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
    }),
});

export const {
    cancelPendingSave,
    getFixtures,
    setFixturesDebounced,
    setFixturesImmediate,
    getFixturesStructure,
    setFixturesStructure,
    clearAll,
} = store;
