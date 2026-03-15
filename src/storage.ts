import type { LeagueList } from "./teams.js";
import type {
    LeagueMatch,
    LeaguePhase,
    LeagueRound,
    MatchResult,
} from "./uefa/fixtures.js";
import type { UEFACompetition } from "./uefa/teams.js";

/**
 * Minimal storage helper: persist data to localStorage.
 */
const FIXTURES_KEY_PREFIX = "football-league:fixtures:";
const FIXTURES_STRUCTURE_KEY_PREFIX = "football-league:fixtures-structure:";
const SELECTED_LEAGUE_KEY = "football-league:selected-league";
const DEBOUNCE_MS = 300;

let pending: ReturnType<typeof setTimeout> | null = null;

/**
 * Get the storage key for fixtures of a specific league.
 * @param {LeagueList | UEFACompetition} league
 * @return {string}
 */
function _getFixturesKey(league: LeagueList | UEFACompetition): string {
    return `${FIXTURES_KEY_PREFIX}${league || "english"}`;
}

/**
 * Get the storage key for fixture structure of a specific league.
 * @param {LeagueList | UEFACompetition} league
 * @return {string}
 */
function _getStructureKey(league: LeagueList | UEFACompetition): string {
    return `${FIXTURES_STRUCTURE_KEY_PREFIX}${league || "english"}`;
}

/**
 * Extract minimal results from full fixtures: nested arrays with {homeGoals, awayGoals} or null.
 * @param {LeaguePhase} fixtures
 * @returns {(MatchResult | null)[][]}
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
 * @param {LeagueList | UEFACompetition} league
 * @return {Array<Array<Object|null>>|null}
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
 * @param {LeaguePhase | (MatchResult | null)[][]} fixtures
 * @param {LeagueList | UEFACompetition} league
 * @return {boolean}
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
 * @param {LeaguePhase} fixtures
 * @param {LeagueList | UEFACompetition} league
 * @return {void}
 */
export function setFixturesDebounced(
    fixtures: LeaguePhase,
    league: LeagueList | UEFACompetition,
) {
    if (pending) clearTimeout(pending);
    const minimal = _extractMinimal(fixtures);
    pending = setTimeout(() => {
        _setFixtures(minimal, league);
        pending = null;
    }, DEBOUNCE_MS);
}

/**
 * Immediate save (cancels debounce) of full fixtures.
 * @param {LeaguePhase} fixtures
 * @param {LeagueList | UEFACompetition} league
 * @return {boolean}
 */
export function setFixturesImmediate(
    fixtures: LeaguePhase,
    league: LeagueList | UEFACompetition,
): boolean {
    if (pending) {
        clearTimeout(pending);
        pending = null;
    }
    return _setFixtures(_extractMinimal(fixtures), league);
}

/**
 * Clear persisted fixtures from storage.
 * @param {LeagueList | UEFACompetition} league
 * @return {void}
 */
export function clearSavedFixtures(league: LeagueList | UEFACompetition): void {
    if (pending) {
        clearTimeout(pending);
        pending = null;
    }
    try {
        localStorage.removeItem(_getFixturesKey(league));
    } catch (e) {
        return;
    }
}

/**
 * Save the fixtures structure (matchups) without results to localStorage.
 * @param {LeaguePhase} fixtures
 * @param {LeagueList | UEFACompetition} league
 * @return {boolean}
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
 * @param {LeagueList | UEFACompetition} league
 * @return {Array<Array<Object>>|null}
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
 * @param {LeagueList | UEFACompetition} league
 * @return {void}
 */
export function clearAll(league: LeagueList | UEFACompetition): void {
    if (pending) {
        clearTimeout(pending);
        pending = null;
    }
    try {
        localStorage.removeItem(_getFixturesKey(league));
        localStorage.removeItem(_getStructureKey(league));
    } catch (e) {
        return;
    }
}

/**
 * Get the currently active league ID from storage.
 * @return {string|null}
 */
export function getSelectedLeague(): LeagueList | UEFACompetition | null {
    try {
        const league = localStorage.getItem(SELECTED_LEAGUE_KEY);
        return league ? JSON.parse(league) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Set the currently active league ID in storage.
 * @param {LeagueList | UEFACompetition} league
 * @return {boolean}
 */
export function setSelectedLeague(
    league: LeagueList | UEFACompetition,
): boolean {
    try {
        localStorage.setItem(SELECTED_LEAGUE_KEY, JSON.stringify(league));
        return true;
    } catch (e) {
        return false;
    }
}
