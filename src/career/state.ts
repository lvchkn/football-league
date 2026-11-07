import type { LeagueList, Teams } from "../interfaces/tournament.js";
import { DOMESTIC_LEAGUES, TOURNAMENTS } from "../competitions.js";
import { CLUB_COMPETITIONS, type ClubCompetition } from "./europe.js";

export const CAREER_PREFIX = "football-league:career:";
const STATE_KEY = `${CAREER_PREFIX}state`;

/** Competitions that exist in Career mode. */
export type CareerCompetition = LeagueList | ClubCompetition;

export interface PlayoffResult {
    topTeam: string;
    secondTeam: string;
    /** "1-0, 2-2 (4-3 pens)" from the top-flight team's side of leg 1. */
    score: string;
    winner: string;
}

export interface LeagueSummary {
    league: LeagueList;
    champion: string;
    promoted?: Teams;
    relegated?: Teams;
    playoff?: PlayoffResult;
}

export interface SeasonSummary {
    /** First calendar year of the season, e.g. 2026 for 2026/27. */
    season: number;
    leagues: LeagueSummary[];
    /** Clubs that entered each competition for the next season. */
    qualified: Record<ClubCompetition, Teams>;
    /** Winners of the UEFA competitions, where they were played to the end. */
    uefaWinners: Partial<Record<ClubCompetition, string>>;
}

export interface CareerState {
    season: number;
    rosters: Record<CareerCompetition, Teams>;
    /** Strongest-first order per league for simulations; absent in season 1. */
    strength: Partial<Record<LeagueList, Teams>>;
    history: SeasonSummary[];
}

export const FIRST_SEASON = 2026;

export function seasonLabel(season: number): string {
    return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}

export function newCareer(): CareerState {
    const rosters = {} as Record<CareerCompetition, Teams>;
    (Object.keys(DOMESTIC_LEAGUES) as LeagueList[]).forEach((id) => {
        rosters[id] = [...DOMESTIC_LEAGUES[id].teams];
    });
    CLUB_COMPETITIONS.forEach((id) => {
        rosters[id] = [...TOURNAMENTS[id].teams];
    });
    return { season: FIRST_SEASON, rosters, strength: {}, history: [] };
}

function isCareerState(value: any): value is CareerState {
    return (
        value &&
        typeof value.season === "number" &&
        value.rosters &&
        [...Object.keys(DOMESTIC_LEAGUES), ...CLUB_COMPETITIONS].every((id) =>
            Array.isArray(value.rosters[id]),
        ) &&
        value.strength &&
        Array.isArray(value.history)
    );
}

/** The saved career, or a new one when none is saved (or it is unreadable). */
export function loadCareer(): CareerState {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (isCareerState(parsed)) return parsed;
    } catch {
        // fall through to a new career
    }
    return newCareer();
}

export function saveCareer(state: CareerState): boolean {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        return true;
    } catch {
        return false;
    }
}

/** Remove every Career-mode key except the career state itself. */
export function clearCareerFixtures(): void {
    try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(CAREER_PREFIX) && key !== STATE_KEY) keys.push(key);
        }
        keys.forEach((key) => localStorage.removeItem(key));
    } catch {
        return;
    }
}

/** Remove the whole career, state included. */
export function resetCareer(): void {
    clearCareerFixtures();
    try {
        localStorage.removeItem(STATE_KEY);
    } catch {
        return;
    }
}
