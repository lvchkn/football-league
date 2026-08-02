/**
 * UEFA Storage Module
 * Manages persistence of UEFA competition state: phase, fixtures, qualified teams,
 * and phase-transition context (top-8, playoff teams, etc.).
 */

import type { Match, LeagueMatch, KnockoutMatch } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";
import type {
    Phase,
    Teams,
    UEFACompetition,
    UEFAContext,
} from "../interfaces/tournament.js";
import { computeRosterVersion } from "../utils/roster-version.js";
import { getUEFATeams } from "./teams.js";

const FIXTURES_KEY_PREFIX = "football-league:uefa:fixtures:";
const STRUCTURE_KEY_PREFIX = "football-league:uefa:fixtures-structure:";
const VERSION_KEY_PREFIX = "football-league:uefa:fixtures-version:";
const PHASE_KEY_PREFIX = "football-league:uefa:phase:";
const PHASE_CONTEXT_KEY_PREFIX = "football-league:uefa:phase-context:";
const QUALIFIED_KEY_PREFIX = "football-league:uefa:qualified-teams:";
const DEBOUNCE_MS = 300;

const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

export function cancelPendingSave(competition: UEFACompetition): void {
    const key = competition || "ucl";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
}

function _fixturesKey(competition: UEFACompetition): string {
    return FIXTURES_KEY_PREFIX + (competition || "ucl");
}
function _structureKey(competition: UEFACompetition): string {
    return STRUCTURE_KEY_PREFIX + (competition || "ucl");
}
function _versionKey(competition: UEFACompetition): string {
    return VERSION_KEY_PREFIX + (competition || "ucl");
}
function _phaseKey(competition: UEFACompetition): string {
    return PHASE_KEY_PREFIX + (competition || "ucl");
}
function _phaseContextKey(competition: UEFACompetition): string {
    return PHASE_CONTEXT_KEY_PREFIX + (competition || "ucl");
}
function _qualifiedKey(competition: UEFACompetition): string {
    return QUALIFIED_KEY_PREFIX + (competition || "ucl");
}

function _extractMinimal(fixtures: Round[]): Match[][] {
    return fixtures.map(function (round: Round) {
        return round.matches;
    });
}

function _getExpectedVersion(
    competition: UEFACompetition,
    providedVersion?: string | null,
): string | null {
    if (providedVersion) return providedVersion;

    return computeRosterVersion(getUEFATeams(competition));
}

function _readStoredVersion(competition: UEFACompetition): string | null {
    try {
        const version = localStorage.getItem(_versionKey(competition));
        return version || null;
    } catch {
        return null;
    }
}

function _writeVersion(
    competition: UEFACompetition,
    version: string | null,
): boolean {
    if (!version) {
        try {
            localStorage.removeItem(_versionKey(competition));
            return true;
        } catch {
            return false;
        }
    }

    try {
        localStorage.setItem(_versionKey(competition), version);
        return true;
    } catch {
        return false;
    }
}

function _clearPersistedFixtures(competition: UEFACompetition): void {
    try {
        localStorage.removeItem(_fixturesKey(competition));
        localStorage.removeItem(_structureKey(competition));
        localStorage.removeItem(_versionKey(competition));
        localStorage.removeItem(_phaseKey(competition));
        localStorage.removeItem(_phaseContextKey(competition));
        localStorage.removeItem(_qualifiedKey(competition));
    } catch {
        return;
    }
}

function _isPersistedDataValid(
    competition: UEFACompetition,
    expectedVersion: string | null,
): boolean {
    if (!expectedVersion) return true;
    return _readStoredVersion(competition) === expectedVersion;
}

function _setFixtures(
    fixtures: Match[][] | Round[],
    competition: UEFACompetition,
    rosterVersion?: string | null,
) {
    try {
        localStorage.setItem(
            _fixturesKey(competition),
            JSON.stringify(fixtures),
        );
        _writeVersion(
            competition,
            _getExpectedVersion(competition, rosterVersion),
        );
        return true;
    } catch (e) {
        return false;
    }
}

export function getFixtures(
    competition: UEFACompetition,
    rosterVersion?: string | null,
) {
    const expectedVersion = _getExpectedVersion(competition, rosterVersion);

    if (
        expectedVersion &&
        !_isPersistedDataValid(competition, expectedVersion)
    ) {
        _clearPersistedFixtures(competition);
        return null;
    }

    try {
        const raw: string | null = localStorage.getItem(
            _fixturesKey(competition),
        );
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function setFixturesDebounced(
    fixtures: Round[],
    competition: UEFACompetition,
    rosterVersion?: string | null,
) {
    const key = competition || "ucl";
    const existing = pendingSaves.get(key);
    if (existing) clearTimeout(existing);

    const minimal = _extractMinimal(fixtures);
    const timeout = setTimeout(function () {
        _setFixtures(minimal, competition, rosterVersion);
        pendingSaves.delete(key);
    }, DEBOUNCE_MS);

    pendingSaves.set(key, timeout);
}

export function setFixturesImmediate(
    fixtures: Round[],
    competition: UEFACompetition,
    rosterVersion?: string | null,
) {
    const key = competition || "ucl";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
    return _setFixtures(_extractMinimal(fixtures), competition, rosterVersion);
}

export function getFixturesStructure(
    competition: UEFACompetition,
    rosterVersion?: string | null,
) {
    const expectedVersion = _getExpectedVersion(competition, rosterVersion);

    if (
        expectedVersion &&
        !_isPersistedDataValid(competition, expectedVersion)
    ) {
        _clearPersistedFixtures(competition);
        return null;
    }

    try {
        const raw = localStorage.getItem(_structureKey(competition));
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function setFixturesStructure(
    fixtures: Round[],
    competition: UEFACompetition,
    rosterVersion?: string | null,
) {
    try {
        const structure = fixtures.map(function (round: Round) {
            return round.matches.map(function (
                match: LeagueMatch | KnockoutMatch,
            ) {
                const entry: {
                    homeTeam: string;
                    awayTeam: string;
                    leg: number | null;
                    tieIndex: number | null;
                } = {
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    leg: null,
                    tieIndex: null,
                };
                if ((match as KnockoutMatch).leg != null) {
                    entry.leg = (match as KnockoutMatch).leg;
                }

                if ((match as KnockoutMatch).tieIndex != null) {
                    entry.tieIndex = (match as KnockoutMatch).tieIndex;
                }

                return entry;
            });
        });
        localStorage.setItem(
            _structureKey(competition),
            JSON.stringify(structure),
        );
        _writeVersion(
            competition,
            _getExpectedVersion(competition, rosterVersion),
        );
        return true;
    } catch (e) {
        return false;
    }
}

export function getPhase(competition: UEFACompetition): Phase {
    try {
        const phase =
            (localStorage.getItem(_phaseKey(competition)) as Phase) || "league";
        return phase;
    } catch (e) {
        return "league";
    }
}

export function setPhase(competition: UEFACompetition, phase: Phase): boolean {
    try {
        localStorage.setItem(_phaseKey(competition), phase);
        return true;
    } catch (e) {
        return false;
    }
}

export function getPhaseContext(competition: UEFACompetition) {
    try {
        const raw = localStorage.getItem(_phaseContextKey(competition));
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function setPhaseContext(
    competition: UEFACompetition,
    context: UEFAContext,
) {
    try {
        localStorage.setItem(
            _phaseContextKey(competition),
            JSON.stringify(context),
        );
        return true;
    } catch (e) {
        return false;
    }
}

export function getQualifiedTeams(
    competition: UEFACompetition,
): string[] | null {
    try {
        const raw = localStorage.getItem(_qualifiedKey(competition));
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function setQualifiedTeams(
    competition: UEFACompetition,
    teams: Teams,
): boolean {
    try {
        localStorage.setItem(_qualifiedKey(competition), JSON.stringify(teams));
        return true;
    } catch (e) {
        return false;
    }
}

export function clearAll(competition: UEFACompetition): void {
    const key = competition || "ucl";
    const existing = pendingSaves.get(key);
    if (existing) {
        clearTimeout(existing);
        pendingSaves.delete(key);
    }
    try {
        _clearPersistedFixtures(competition);
        localStorage.removeItem(_phaseKey(competition));
        localStorage.removeItem(_phaseContextKey(competition));
        localStorage.removeItem(_qualifiedKey(competition));
    } catch (e) {
        console.warn("Failed to clear UEFA storage", e);
    }
}
