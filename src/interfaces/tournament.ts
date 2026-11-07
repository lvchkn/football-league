import type { Pairing } from "./match.js";
import type { LeaguePhase, Round } from "./round.js";
import type { TableRow } from "./table.js";
import type { Legs } from "../utils/knockout.js";
import type { DrawRules, GroupSchedule, ThirdPlaceRanking } from "../utils/groups.js";

export type Phase =
    | "groups"
    | "league"
    | "r32"
    | "playoffs"
    | "r16"
    | "quarterfinals"
    | "semifinals"
    | "final"
    | "finished";

export type LeagueList =
    | "english"
    | "english-2"
    | "french"
    | "french-2"
    | "german"
    | "german-2"
    | "italian"
    | "italian-2"
    | "spanish"
    | "spanish-2"
    | "russian"
    | "dutch"
    | "belgian"
    | "serbian"
    | "greek"
    | "turkish";

/** Competitions run by the stage-based tournament app (club and national). */
export type TournamentKey = "ucl" | "el" | "cl" | "euro" | "wc";

export type Teams = string[];

export interface League {
    key: LeagueList;
    name: string;
    teams: Teams;
}

export interface StageContext {
    playoffTeams?: string[];
    top8?: string[];
    playoffWinners?: string[];
    qualifiedTeams?: string[];
    finalists?: string[];
}

/**
 * A round-robin stage whose final standings decide who advances.
 */
export interface LeagueStage {
    kind: "league";
    phase: Phase;
    label: string;
    generate(teams: Teams): LeaguePhase;
    /** Highlighted table positions, best first; positions past the last zone are plain. */
    zones?: StandingsZone[];
    /** Build the context for the next stage from the final standings (best first). */
    advance(standings: Teams, context: StageContext): StageContext;
}

/**
 * Table positions 1..upTo (after the previous zone) share a highlight.
 */
export interface StandingsZone {
    upTo: number;
    status: "qualified" | "contention";
}

/**
 * A knockout stage played over one or two legs per tie.
 */
export interface KnockoutStage {
    kind: "knockout";
    phase: Phase;
    label: string;
    legs: Legs;
    pairings(context: StageContext): Pairing[];
    /** Build the context for the next stage; omitted on the last stage. */
    advance?(winners: Teams, context: StageContext): StageContext;
}

/**
 * Small round-robin groups played in parallel (e.g. the Euro group stage).
 */
export interface GroupStage {
    kind: "groups";
    phase: Phase;
    label: string;
    /** Group letter -> teams in draw position order (A1, A2, A3, A4). */
    groups: Record<string, Teams>;
    /** Match order within each group, by draw position. Defaults to the Euro order. */
    schedule?: GroupSchedule;
    /** How third-placed teams are compared across groups. */
    thirdPlaceRanking?: ThirdPlaceRanking;
    /** Seeding pots for redrawing the groups; one team per pot per group. */
    pots?: Teams[];
    /** Constraints for redrawing, e.g. the host in A1 or confederation limits. */
    drawRules?: DrawRules;
    /** Third-placed teams that go through, ranked across all groups. */
    qualifyingThirds: number;
    /** Build the next stage's context from the final group tables (best first). */
    advance(tables: Record<string, TableRow[]>, context: StageContext): StageContext;
}

export type Stage = LeagueStage | GroupStage | KnockoutStage;

/**
 * Ordered stages of a competition. The winner of the last stage's
 * only tie is the champion.
 */
export interface TournamentFormat {
    stages: Stage[];
}

/**
 * A completed tournament phase preserved for read-only result browsing.
 */
export interface StageHistoryEntry {
    phase: Phase;
    fixtures: Round[];
}

export interface TeamsByCompetition {
    [key: string]: string[];
}

export interface CompetitionApp {
    init(): void;
    save(): void;
    reset(): void;
    regenerate(): void;
    destroy(): void;
}
