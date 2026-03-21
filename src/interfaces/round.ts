import type { KnockoutMatch, LeagueMatch, Match } from "./match.js";

export interface Round {
    matches: Match[];
}

export interface LeagueRound extends Round {
    matches: LeagueMatch[];
}

export interface KnockoutRound extends Round {
    matches: KnockoutMatch[];
}

export type LeaguePhase = LeagueRound[];
