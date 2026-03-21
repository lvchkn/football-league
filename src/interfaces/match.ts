export interface Pairing {
    homeTeam: string;
    awayTeam: string;
}

export interface MatchResult {
    homeGoals: number | null;
    awayGoals: number | null;
}

export interface Match extends Pairing {
    homeGoals: number | null;
    awayGoals: number | null;
}

export interface LeagueMatch extends Match {
    // no additional fields needed for league matches
}

export interface KnockoutMatch extends Match {
    leg: number;
    tieIndex: number; // to link leg 1 and leg 2 of the same tie
}

export interface MatchUpdate {
    match: Match;
    oldMatch: Match;
}
