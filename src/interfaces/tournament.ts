import type { Pairing } from "./match.js";
import type { LeaguePhase, Round } from "./round.js";
import type { Legs } from "../utils/knockout.js";

export type Phase =
    | "league"
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

export type UEFACompetition = "ucl" | "el" | "cl";

export type Teams = string[];

export interface League {
    key: LeagueList;
    name: string;
    teams: Teams;
}

export interface UEFAContext {
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
    /** Build the context for the next stage from the final standings (best first). */
    advance(standings: Teams, context: UEFAContext): UEFAContext;
}

/**
 * A knockout stage played over one or two legs per tie.
 */
export interface KnockoutStage {
    kind: "knockout";
    phase: Phase;
    label: string;
    legs: Legs;
    pairings(context: UEFAContext): Pairing[];
    /** Build the context for the next stage; omitted on the last stage. */
    advance?(winners: Teams, context: UEFAContext): UEFAContext;
}

export type Stage = LeagueStage | KnockoutStage;

/**
 * Ordered stages of a competition. The winner of the last stage's
 * only tie is the champion.
 */
export interface TournamentFormat {
    stages: Stage[];
}

/**
 * A completed UEFA phase preserved for read-only result browsing.
 */
export interface UEFAHistoryEntry {
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
