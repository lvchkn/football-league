/**
 * Tournament persistence: fixtures (stored in full, penalties included),
 * current phase, the context handed between stages, completed-stage
 * history and any custom group draw.
 */
import type { KnockoutMatch, Match } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";
import type {
    Phase,
    Teams,
    TournamentKey,
    StageContext,
    StageHistoryEntry,
} from "../interfaces/tournament.js";
import { createFixtureStore } from "../fixture-store.js";
import { getRosterVersion } from "../competitions.js";

const store = createFixtureStore({
    // Key prefix predates national-team support; kept so existing saves still load.
    prefix: "football-league:uefa:",
    defaultId: "ucl",
    expectedVersion: (competition) =>
        getRosterVersion(competition as TournamentKey),
    serializeResult: (match) => match,
    serializeStructure: (match) => ({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        leg: (match as KnockoutMatch).leg ?? null,
        tieIndex: (match as KnockoutMatch).tieIndex ?? null,
    }),
    extraKeys: ["phase", "phase-context", "qualified-teams", "history", "groups"],
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

export function getPhase(competition: TournamentKey): Phase {
    try {
        return (localStorage.getItem(store.key("phase", competition)) as Phase) || "league";
    } catch {
        return "league";
    }
}

export function setPhase(competition: TournamentKey, phase: Phase): boolean {
    try {
        localStorage.setItem(store.key("phase", competition), phase);
        return true;
    } catch {
        return false;
    }
}

export function getPhaseContext(competition: TournamentKey): StageContext | null {
    return store.readJson("phase-context", competition);
}

export function setPhaseContext(competition: TournamentKey, context: StageContext): boolean {
    return store.writeJson("phase-context", competition, context);
}

export function getQualifiedTeams(competition: TournamentKey): string[] | null {
    return store.readJson("qualified-teams", competition);
}

export function setQualifiedTeams(competition: TournamentKey, teams: Teams): boolean {
    return store.writeJson("qualified-teams", competition, teams);
}

function _cloneFixtures(fixtures: Round[]): Round[] {
    return fixtures.map((round) => ({
        matches: round.matches.map((match: Match) => ({ ...match })),
    }));
}

export function getHistory(
    competition: TournamentKey,
    rosterVersion?: string | null,
): StageHistoryEntry[] {
    if (!store.checkVersion(competition, rosterVersion)) return [];
    const history = store.readJson("history", competition);
    return Array.isArray(history) ? history : [];
}

/**
 * Keep a read-only copy of a completed phase, replacing any earlier copy.
 */
export function archivePhase(
    competition: TournamentKey,
    phase: Phase,
    fixtures: Round[],
    rosterVersion?: string | null,
): boolean {
    const history = getHistory(competition, rosterVersion).filter(
        (entry) => entry.phase !== phase,
    );
    history.push({ phase, fixtures: _cloneFixtures(fixtures) });
    if (!store.writeJson("history", competition, history)) return false;
    store.writeVersion(competition, rosterVersion);
    return true;
}

/**
 * The group draw in use, when it differs from the format's default draw.
 * Returned unvalidated; callers check it against the format.
 */
export function getGroups(competition: TournamentKey): unknown {
    return store.readJson("groups", competition);
}

export function setGroups(competition: TournamentKey, groups: Record<string, Teams>): boolean {
    return store.writeJson("groups", competition, groups);
}
