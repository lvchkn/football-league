import type { Match } from "../interfaces/match.js";
import type { LeaguePhase } from "../interfaces/round.js";
import type { LeagueList, Teams } from "../interfaces/tournament.js";
import { applyMatchResult, initTable, sortTable } from "../utils/table.js";
import {
    equalRatings,
    getUnplayedRoundIndices,
    ratingsFromSeeding,
    simulateLeagueRounds,
    simulateTwoLegTies,
    type RatingOf,
    type Rng,
} from "../utils/simulation.js";
import { getTieWinner } from "../utils/knockout.js";
import { DOMESTIC_LEAGUES } from "../competitions.js";
import { PYRAMIDS, TOP_FLIGHTS, type Pyramid } from "./rules.js";
import { CLUB_COMPETITIONS, allocateEuropeanPlaces, type ClubCompetition } from "./europe.js";
import { baseEuropeanLists, careerSlots } from "./places.js";
import type {
    CareerState,
    LeagueSummary,
    PlayoffResult,
    SeasonSummary,
} from "./state.js";

/** Simulation strength of a league's teams this season. */
export function leagueRatings(state: CareerState, league: LeagueList): RatingOf {
    const order = state.strength[league];
    return order ? ratingsFromSeeding(order) : equalRatings;
}

/**
 * Play out every unplayed match and return the final standings, best first.
 */
export function completeLeague(
    teams: Teams,
    fixtures: LeaguePhase,
    ratingOf: RatingOf,
    rng: Rng = Math.random,
): Teams {
    simulateLeagueRounds(fixtures, getUnplayedRoundIndices(fixtures), ratingOf, rng);
    const table = initTable(teams);
    fixtures.forEach((round) => round.matches.forEach((match) => applyMatchResult(match, table)));
    return sortTable(table).map((row) => row.team);
}

function _playoff(topTeam: string, secondTeam: string, ratingOf: RatingOf, rng: Rng): PlayoffResult {
    const leg1: Match = { homeTeam: secondTeam, awayTeam: topTeam, homeGoals: null, awayGoals: null };
    const leg2: Match = { homeTeam: topTeam, awayTeam: secondTeam, homeGoals: null, awayGoals: null };
    simulateTwoLegTies([leg1, leg2], ratingOf, rng);

    const pens =
        leg2.homePenalties != null ? ` (${leg2.homePenalties}-${leg2.awayPenalties} pens)` : "";
    return {
        topTeam,
        secondTeam,
        score: `${leg1.homeTeam} ${leg1.homeGoals}-${leg1.awayGoals} ${leg1.awayTeam}, ` +
            `${leg2.homeTeam} ${leg2.homeGoals}-${leg2.awayGoals} ${leg2.awayTeam}${pens}`,
        winner: getTieWinner(leg1, leg2)!,
    };
}

export interface PyramidOutcome {
    /** Next season's rosters, strongest first. */
    top: Teams;
    second: Teams;
    promoted: Teams;
    relegated: Teams;
    playoff?: PlayoffResult;
}

/**
 * Swap teams between tiers. Rosters come back strongest-first for next
 * season: survivors keep their order, promoted teams join the bottom of the
 * top flight and relegated teams the top of the second tier.
 */
export function applyPyramid(
    rule: Pyramid,
    topStandings: Teams,
    secondStandings: Teams,
    rng: Rng = Math.random,
): PyramidOutcome {
    const relegated = topStandings.slice(topStandings.length - rule.direct);
    const promoted = secondStandings.slice(0, rule.direct);
    let playoff: PlayoffResult | undefined;

    if (rule.playoff) {
        const topTeam = topStandings[topStandings.length - rule.direct - 1]!;
        const secondTeam = secondStandings[rule.direct]!;
        playoff = _playoff(
            topTeam,
            secondTeam,
            ratingsFromSeeding([...topStandings, ...secondStandings]),
            rng,
        );
        if (playoff.winner === secondTeam) {
            relegated.unshift(topTeam);
            promoted.push(secondTeam);
        }
    }

    const moving = new Set([...relegated, ...promoted]);
    return {
        top: [...topStandings.filter((t) => !moving.has(t)), ...promoted],
        second: [...relegated, ...secondStandings.filter((t) => !moving.has(t))],
        promoted,
        relegated,
        ...(playoff ? { playoff } : {}),
    };
}

export interface SeasonInputs {
    /** Current fixtures (with saved results) of a domestic league. */
    loadFixtures(league: LeagueList, teams: Teams): LeaguePhase;
    /** Winner of a UEFA competition, if it was played to the end. */
    uefaWinner(competition: ClubCompetition): string | null;
}

/**
 * Finish the season: complete every league, move teams between tiers,
 * fill next season's European places, and record what happened.
 */
export function endSeason(
    state: CareerState,
    inputs: SeasonInputs,
    rng: Rng = Math.random,
): { next: CareerState; summary: SeasonSummary } {
    const standings = {} as Record<LeagueList, Teams>;
    (Object.keys(DOMESTIC_LEAGUES) as LeagueList[]).forEach((league) => {
        const teams = state.rosters[league];
        standings[league] = completeLeague(
            teams,
            inputs.loadFixtures(league, teams),
            leagueRatings(state, league),
            rng,
        );
    });

    // Without promotion or relegation, next season's strength is this season's table.
    const nextRosters = { ...state.rosters };
    const strength: Partial<Record<LeagueList, Teams>> = { ...standings };
    const summaries = new Map<LeagueList, LeagueSummary>();
    (Object.keys(standings) as LeagueList[]).forEach((league) =>
        summaries.set(league, { league, champion: standings[league][0]! }),
    );

    PYRAMIDS.forEach((rule) => {
        const outcome = applyPyramid(rule, standings[rule.top], standings[rule.second], rng);
        nextRosters[rule.top] = outcome.top;
        nextRosters[rule.second] = outcome.second;
        strength[rule.top] = outcome.top;
        strength[rule.second] = outcome.second;
        const topSummary = summaries.get(rule.top)!;
        topSummary.relegated = outcome.relegated;
        if (outcome.playoff) topSummary.playoff = outcome.playoff;
        summaries.get(rule.second)!.promoted = outcome.promoted;
    });

    const slots = careerSlots();
    const topStandings: Partial<Record<LeagueList, Teams>> = {};
    TOP_FLIGHTS.forEach((league) => (topStandings[league] = standings[league]));
    const europe = allocateEuropeanPlaces(baseEuropeanLists(), slots, topStandings);

    const qualified = {} as Record<ClubCompetition, Teams>;
    const uefaWinners: Partial<Record<ClubCompetition, string>> = {};
    CLUB_COMPETITIONS.forEach((c) => {
        nextRosters[c] = europe[c];
        qualified[c] = europe[c].filter((_, i) => slots[c][i] != null);
        const winner = inputs.uefaWinner(c);
        if (winner) uefaWinners[c] = winner;
    });

    const summary: SeasonSummary = {
        season: state.season,
        leagues: [...summaries.values()],
        qualified,
        uefaWinners,
    };

    return {
        next: {
            season: state.season + 1,
            rosters: nextRosters,
            strength,
            history: [...state.history, summary],
        },
        summary,
    };
}
