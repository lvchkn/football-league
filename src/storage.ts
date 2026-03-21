import type { LeagueList, UEFACompetition } from "./interfaces/tournament.js";

const SELECTED_LEAGUE_KEY = "football-league:selected-league";

/**
 * Get the currently active league ID from storage.
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
