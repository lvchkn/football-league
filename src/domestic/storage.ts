import type { LeagueList } from "../interfaces/tournament.js";
import { createFixtureStore } from "../fixture-store.js";
import { getRosterVersion } from "../competitions.js";

/**
 * Domestic league persistence under a key prefix. Results are stored
 * minimally: goals only, or null for unplayed matches.
 */
export function createDomesticStorage(
    prefix: string,
    expectedVersion: (league: string) => string | null,
) {
    const store = createFixtureStore({
        prefix,
        defaultId: "english",
        expectedVersion,
        serializeResult: (match) =>
            !match || (match.homeGoals == null && match.awayGoals == null)
                ? null
                : { homeGoals: match.homeGoals, awayGoals: match.awayGoals },
        serializeStructure: (match) => ({
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
        }),
    });

    return {
        cancelPendingSave: store.cancelPendingSave,
        getFixtures: store.getFixtures,
        setFixturesDebounced: store.setFixturesDebounced,
        setFixturesImmediate: store.setFixturesImmediate,
        getFixturesStructure: store.getFixturesStructure,
        setFixturesStructure: store.setFixturesStructure,
        clearAll: store.clearAll,
    };
}

export type DomesticStorage = ReturnType<typeof createDomesticStorage>;

/** Classic-mode storage. */
export const classicDomesticStorage = createDomesticStorage(
    "football-league:",
    (league) => getRosterVersion(league as LeagueList),
);

export const {
    cancelPendingSave,
    getFixtures,
    setFixturesDebounced,
    setFixturesImmediate,
    getFixturesStructure,
    setFixturesStructure,
    clearAll,
} = classicDomesticStorage;
