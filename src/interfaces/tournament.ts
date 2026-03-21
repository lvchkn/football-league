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
    | "french"
    | "german"
    | "italian"
    | "spanish"
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
