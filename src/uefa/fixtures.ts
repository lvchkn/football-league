import type { LeagueMatch, Pairing } from "../interfaces/match.js";
import { generateKnockoutRound } from "../utils/knockout.js";

export { getKnockoutWinners, getTieWinner } from "../utils/knockout.js";
import type {
    KnockoutRound,
    LeaguePhase,
    LeagueRound,
} from "../interfaces/round.js";

/**
 * Generate league phase fixtures (8 rounds, 36 teams, each team plays exactly 8 matches).
 * Uses the circle method from round-robin scheduling, taking the first 8 of 35 possible rounds.
 * Each round has 18 matches (all 36 teams play once per round).
 */
export function generateLeagueFixtures(teamNames: string[]): LeaguePhase {
    if (teamNames.length !== 36) {
        throw new Error("League phase requires exactly 36 teams");
    }

    const numberOfTeams: number = teamNames.length;
    const numberOfRounds = 8;

    // Circle method: fix team[0], rotate indices [1..n-1]
    const rotating: number[] = [];
    for (let i = 1; i < numberOfTeams; i++) {
        rotating.push(i);
    }

    const rounds: LeagueRound[] = [];

    for (let round = 0; round < numberOfRounds; round++) {
        const matches: LeagueMatch[] = [];
        const opponentIdx: number = rotating[rotating.length - 1];

        if (round % 2 === 0) {
            matches.push({
                homeTeam: teamNames[0],
                awayTeam: teamNames[opponentIdx],
                homeGoals: null,
                awayGoals: null,
            });
        } else {
            matches.push({
                homeTeam: teamNames[opponentIdx],
                awayTeam: teamNames[0],
                homeGoals: null,
                awayGoals: null,
            });
        }

        // Pair remaining from ends of the rotation array
        const halfLen: number = (numberOfTeams - 2) / 2; // 17 for 36 teams

        for (let i = 0; i < halfLen; i++) {
            const a: number = rotating[i];
            const b: number = rotating[rotating.length - 2 - i];

            if ((round + i) % 2 === 0) {
                matches.push({
                    homeTeam: teamNames[a],
                    awayTeam: teamNames[b],
                    homeGoals: null,
                    awayGoals: null,
                });
            } else {
                matches.push({
                    homeTeam: teamNames[b],
                    awayTeam: teamNames[a],
                    homeGoals: null,
                    awayGoals: null,
                });
            }
        }

        rounds.push({
            matches,
        });

        // Rotate right: move last element to front
        rotating.unshift(rotating.pop()!);
    }

    return rounds;
}

/**
 * Generate two-leg knockout fixtures from an array of seed pairings.
 * In each pairing the first team is home in Leg 1, second team is home in Leg 2.
 */
export function generateKnockoutFixtures(pairings: Pairing[]): KnockoutRound {
    return generateKnockoutRound(pairings, 2);
}

/**
 * Create playoff pairings from teams ranked 9-24 in the league phase.
 * Seeding: 9 vs 24, 10 vs 23, 11 vs 22, ... , 16 vs 17.
 * Lower-seeded team is home in Leg 1; higher seed gets home advantage in Leg 2.
 */
export function createPlayoffPairings(playoffTeams: string[]): Pairing[] {
    const pairings: Pairing[] = [];
    const half: number = playoffTeams.length / 2;

    for (let i = 0; i < half; i++) {
        // Lower seed (e.g. 24th) is home in Leg 1, higher seed (e.g. 9th) in Leg 2
        pairings.push({
            homeTeam: playoffTeams[playoffTeams.length - 1 - i],
            awayTeam: playoffTeams[i],
        });
    }

    return pairings;
}

/**
 * Create Round-of-16 pairings.
 * Top 8 (direct qualifiers) vs 8 playoff winners.
 * 1st vs playoff-winner-8, 2nd vs playoff-winner-7, ...
 * Playoff winners are home Leg 1; top-8 teams home Leg 2.
 */
export function createR16Pairings(
    top8: string[],
    playoffWinners: string[],
): Pairing[] {
    const pairings: Pairing[] = [];

    for (let i = 0; i < top8.length; i++) {
        pairings.push({
            homeTeam: playoffWinners[playoffWinners.length - 1 - i],
            awayTeam: top8[i],
        });
    }

    return pairings;
}
