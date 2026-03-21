import type { MatchResult, LeagueMatch } from "../interfaces/match.js";
import type { LeaguePhase, LeagueRound } from "../interfaces/round.js";
import type { LeagueList, UEFACompetition } from "../interfaces/tournament.js";

/**
 * Minimal storage helper: persist data to localStorage.
 */
const FIXTURES_KEY_PREFIX = "football-league:fixtures:";
const FIXTURES_STRUCTURE_KEY_PREFIX = "football-league:fixtures-structure:";
const DEBOUNCE_MS = 300;

const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Cancel a pending save if one exists.
 */
export function cancelPendingSave(league: LeagueList | UEFACompetition): void {
    const key = league || "english";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
}

/**
 * Get the storage key for fixtures of a specific league.
 */
function _getFixturesKey(league: LeagueList | UEFACompetition): string {
    return `${FIXTURES_KEY_PREFIX}${league || "english"}`;
}

/**
 * Get the storage key for fixture structure of a specific league.
 */
function _getStructureKey(league: LeagueList | UEFACompetition): string {
    return `${FIXTURES_STRUCTURE_KEY_PREFIX}${league || "english"}`;
}

/**
 * Extract minimal results from full fixtures: nested arrays with {homeGoals, awayGoals} or null.
 */
function _extractMinimal(fixtures: LeaguePhase): (MatchResult | null)[][] {
    return fixtures.map((round: LeagueRound) =>
        round.matches.map((match: LeagueMatch) => {
            if (!match) return null;

            if (match.homeGoals == null && match.awayGoals == null) {
                return null;
            }

            return {
                homeGoals: match.homeGoals,
                awayGoals: match.awayGoals,
            };
        }),
    );
}

/**
 * Load persisted minimal results from localStorage.
 */
export function getFixtures(league: LeagueList | UEFACompetition) {
    try {
        const fixtures = localStorage.getItem(_getFixturesKey(league));
        if (!fixtures) return null;
        return JSON.parse(fixtures);
    } catch (e) {
        return null;
    }
}

/**
 * Write fixtures to localStorage (sync).
 */
function _setFixtures(
    fixtures: LeaguePhase | (MatchResult | null)[][],
    league: LeagueList | UEFACompetition,
): boolean {
    try {
        localStorage.setItem(_getFixturesKey(league), JSON.stringify(fixtures));
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Debounced save: accept full fixtures, extract minimal and persist later.
 */
export function setFixturesDebounced(
    fixtures: LeaguePhase,
    league: LeagueList | UEFACompetition,
) {
    const key = league || "english";
    const existing = pendingSaves.get(key);
    if (existing) clearTimeout(existing);

    const minimal = _extractMinimal(fixtures);
    const timeout = setTimeout(() => {
        _setFixtures(minimal, league);
        pendingSaves.delete(key);
    }, DEBOUNCE_MS);

    pendingSaves.set(key, timeout);
}

/**
 * Immediate save (cancels debounce) of full fixtures.
 */
export function setFixturesImmediate(
    fixtures: LeaguePhase,
    league: LeagueList | UEFACompetition,
): boolean {
    const key = league || "english";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
    return _setFixtures(_extractMinimal(fixtures), league);
}

/**
 * Clear persisted fixtures from storage.
 */
export function clearSavedFixtures(league: LeagueList | UEFACompetition): void {
    const key = league || "english";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
    try {
        localStorage.removeItem(_getFixturesKey(league));
    } catch (e) {
        return;
    }
}

/**
 * Save the fixtures structure (matchups) without results to localStorage.
 */
export function setFixturesStructure(
    fixtures: LeaguePhase,
    league: LeagueList | UEFACompetition,
) {
    try {
        const structure = fixtures.map((round) =>
            round.matches.map((match) => ({
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
            })),
        );
        localStorage.setItem(
            _getStructureKey(league),
            JSON.stringify(structure),
        );
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Load the fixture structure from localStorage.
 */
export function getFixturesStructure(league: LeagueList | UEFACompetition) {
    try {
        const structure = localStorage.getItem(_getStructureKey(league));
        if (!structure) return null;
        return JSON.parse(structure);
    } catch (e) {
        return null;
    }
}

/**
 * Clear both fixtures structure and results for a league.
 */
export function clearAll(league: LeagueList | UEFACompetition): void {
    const key = league || "english";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
    try {
        localStorage.removeItem(_getFixturesKey(league));
        localStorage.removeItem(_getStructureKey(league));
    } catch (e) {
        return;
    }
}
