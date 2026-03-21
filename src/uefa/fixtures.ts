import type { Phase, UEFAContext } from "../interfaces/tournament.js";
import type {
    KnockoutMatch,
    LeagueMatch,
    Match,
    Pairing,
} from "../interfaces/match.js";
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
    const matches: KnockoutMatch[] = [];

    pairings.forEach(function (pair, i) {
        matches.push({
            homeTeam: pair.homeTeam,
            awayTeam: pair.awayTeam,
            homeGoals: null,
            awayGoals: null,
            leg: 1,
            tieIndex: i,
        });
        matches.push({
            homeTeam: pair.awayTeam,
            awayTeam: pair.homeTeam,
            homeGoals: null,
            awayGoals: null,
            leg: 2,
            tieIndex: i,
        });
    });

    const knockoutRound: KnockoutRound = {
        matches,
    };

    return knockoutRound;
}

/**
 * Generate a single-match final fixture.
 */
export function generateFinalFixture(teamA: string, teamB: string): Match {
    return {
        homeTeam: teamA,
        awayTeam: teamB,
        homeGoals: null,
        awayGoals: null,
    };
}

/**
 * Determine the winner of a completed two-leg tie.
 * If the aggregate is level, the higher-seeded team (Leg 1 home) advances
 * (in real life this would go to extra time and penalties in Leg 2).
 */
export function getTieWinner(leg1: Match, leg2: Match): string | null {
    if (
        leg1.homeGoals === null ||
        leg1.awayGoals === null ||
        leg2.homeGoals === null ||
        leg2.awayGoals === null
    ) {
        return null;
    }

    const team1: string = leg1.homeTeam;
    const aggregate1: number = leg1.homeGoals + leg2.awayGoals;

    const team2: string = leg1.awayTeam;
    const aggregate2: number = leg1.awayGoals + leg2.homeGoals;

    if (aggregate1 > aggregate2) return team1;
    if (aggregate2 > aggregate1) return team2;

    // Tied on aggregate — higher seed (leg 1 home) advances
    return team1;
}

/**
 * Extract every tie winner from a set of two-leg knockout fixtures.
 * Matches in the flat list are expected to alternate: leg1, leg2, leg1, leg2, ...
 */
export function getKnockoutWinners(fixtures: KnockoutRound): string[] {
    const matches: KnockoutMatch[] = fixtures.matches;
    const winners: string[] = [];

    for (let i = 0; i < matches.length; i += 2) {
        const winner: string | null = getTieWinner(matches[i], matches[i + 1]);

        if (winner) {
            winners.push(winner);
        }
    }

    return winners;
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

/**
 * Top-level fixture generator for any UEFA phase.
 */
export function generateUEFAFixtures(
    teamNames: string[],
    phase: Phase,
    context: UEFAContext,
): LeaguePhase | KnockoutRound | Match {
    phase = phase || "league";
    context = context || {};

    switch (phase) {
        case "league": {
            return generateLeagueFixtures(teamNames);
        }
        case "playoffs": {
            const playOffPairings: Pairing[] = createPlayoffPairings(
                context.playoffTeams || teamNames,
            );
            return generateKnockoutFixtures(playOffPairings);
        }
        case "r16": {
            const r16Pairings: Pairing[] = createR16Pairings(
                context.top8 || [],
                context.playoffWinners || [],
            );
            return generateKnockoutFixtures(r16Pairings);
        }
        case "quarterfinals":
        case "semifinals": {
            const qualifiedPairings: Pairing[] = createPlayoffPairings(
                context.qualifiedTeams || teamNames,
            );
            return generateKnockoutFixtures(qualifiedPairings);
        }
        case "final": {
            const finalists = context.finalists || teamNames.slice(0, 2);
            return generateFinalFixture(finalists[0], finalists[1]);
        }
        default:
            throw new Error(`Unknown UEFA phase: ${phase}`);
    }
}
