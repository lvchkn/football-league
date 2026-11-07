/**
 * Builds what each competition app runs on. Classic mode uses the fixed
 * team lists and the original storage keys; Career mode uses the current
 * season's rosters and its own keys, so the two never touch each other.
 */
import type { LeagueList, TournamentKey } from "./interfaces/tournament.js";
import type { LeaguePhase } from "./interfaces/round.js";
import type { DomesticContext } from "./domestic/app.js";
import type { TournamentContext } from "./tournament/app.js";
import { classicDomesticStorage, createDomesticStorage } from "./domestic/storage.js";
import { classicTournamentStorage, createTournamentStorage } from "./tournament/storage.js";
import { loadLeagueFixtures } from "./domestic/load.js";
import { getRosterVersion, getTeams, isCompetition, isTournament } from "./competitions.js";
import { equalRatings, ratingsFromSeeding } from "./utils/simulation.js";
import { computeRosterVersion } from "./utils/roster-version.js";
import { getMatchWinner } from "./utils/knockout.js";
import { getMode } from "./mode.js";
import { CAREER_PREFIX, loadCareer, type CareerCompetition, type CareerState } from "./career/state.js";
import { leagueRatings, type SeasonInputs } from "./career/season.js";
import { leagueZones } from "./career/places.js";
import { CLUB_COMPETITIONS, type ClubCompetition } from "./career/europe.js";

/** Career saves belong to one season and one roster. */
function careerVersion(state: CareerState, id: CareerCompetition): string {
    return `${state.season}:${computeRosterVersion(state.rosters[id] ?? [])}`;
}

const careerDomesticStorage = createDomesticStorage(CAREER_PREFIX, (id) =>
    careerVersion(loadCareer(), id as LeagueList),
);

const careerTournamentStorage = createTournamentStorage(`${CAREER_PREFIX}uefa:`, (id) =>
    careerVersion(loadCareer(), id as ClubCompetition),
);

/** National-team tournaments stay Classic-only. */
export function isCareerCompetition(id: string): id is CareerCompetition {
    return isCompetition(id) && (!isTournament(id) || (CLUB_COMPETITIONS as string[]).includes(id));
}

export function domesticContext(id: LeagueList): DomesticContext {
    if (getMode() === "career") {
        const state = loadCareer();
        return {
            id,
            teams: state.rosters[id],
            rosterVersion: careerVersion(state, id),
            storage: careerDomesticStorage,
            ratingOf: leagueRatings(state, id),
            zones: leagueZones(id, state.rosters[id].length),
        };
    }
    return {
        id,
        teams: getTeams(id),
        rosterVersion: getRosterVersion(id),
        storage: classicDomesticStorage,
        ratingOf: equalRatings,
        zones: [],
    };
}

export function tournamentContext(id: TournamentKey): TournamentContext {
    if (getMode() === "career" && (CLUB_COMPETITIONS as string[]).includes(id)) {
        const state = loadCareer();
        const teams = state.rosters[id as ClubCompetition];
        return {
            id,
            teams,
            rosterVersion: careerVersion(state, id as ClubCompetition),
            storage: careerTournamentStorage,
            ratingOf: ratingsFromSeeding(teams),
        };
    }
    const teams = getTeams(id);
    return {
        id,
        teams,
        rosterVersion: getRosterVersion(id),
        storage: classicTournamentStorage,
        ratingOf: ratingsFromSeeding(teams),
    };
}

/** What the season-end needs from the current career saves. */
export function careerSeasonInputs(state: CareerState): SeasonInputs {
    return {
        loadFixtures(league: LeagueList): LeaguePhase {
            return loadLeagueFixtures(
                careerDomesticStorage,
                league,
                state.rosters[league],
                careerVersion(state, league),
            );
        },
        uefaWinner(competition: ClubCompetition): string | null {
            if (careerTournamentStorage.getPhase(competition) !== "finished") return null;
            const fixtures = careerTournamentStorage.getFixtures(
                competition,
                careerVersion(state, competition),
            );
            // Saved results are stored per round as a plain array of matches
            const final = Array.isArray(fixtures?.[0]) ? fixtures[0][0] : null;
            return final ? getMatchWinner(final) : null;
        },
    };
}
