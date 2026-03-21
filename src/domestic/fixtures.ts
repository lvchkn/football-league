import type { LeagueMatch } from "../interfaces/match.js";
import type { LeaguePhase, LeagueRound } from "../interfaces/round.js";
import type { Teams } from "../interfaces/tournament.js";
import { shuffleArray } from "../utils/shuffle.js";

/**
 * Round-robin fixture generation (circle method)
 */
export function generateFixtures(teamNames: Teams): LeaguePhase {
    const shuffledTeams: Teams = shuffleArray(teamNames);
    const numberOfTeams: number = shuffledTeams.length;
    let teams: Teams = shuffledTeams.slice();

    if (numberOfTeams % 2 === 1) {
        throw new Error(
            "Number of teams must be even for round-robin scheduling",
        );
    }

    const rounds = teams.length - 1;
    const mid = teams.length / 2;

    const firstHalf: LeaguePhase = [];

    for (let round = 0; round < rounds; round++) {
        const matches: LeagueMatch[] = [];

        for (let matchIndex = 0; matchIndex < mid; matchIndex++) {
            const homeTeam: string = teams[matchIndex];
            const awayTeam: string = teams[teams.length - 1 - matchIndex];

            if (homeTeam && awayTeam) {
                matches.push({
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeGoals: null,
                    awayGoals: null,
                });
            }
        }

        // randomly flip home/away for each match to avoid one-sided home schedule
        for (let i = 0; i < matches.length; i++) {
            if (Math.random() < 0.5) {
                const m: LeagueMatch = matches[i];
                [m.homeTeam, m.awayTeam] = [m.awayTeam, m.homeTeam];
            }
        }

        const shuffledMatches: LeagueMatch[] = shuffleArray(matches);
        firstHalf.push({ matches: shuffledMatches });

        const [fixed, ...rest] = teams;
        const rotated = [rest.pop()!, ...rest];
        teams = [fixed, ...rotated];
    }

    const secondHalfMatches: LeagueMatch[][] = firstHalf.map(
        (round: LeagueRound) =>
            round.matches.map((match: LeagueMatch) => ({
                homeTeam: match.awayTeam,
                awayTeam: match.homeTeam,
                homeGoals: null,
                awayGoals: null,
            })),
    );

    const allMatches: LeaguePhase = [
        ...firstHalf,
        ...secondHalfMatches.map((matches) => ({ matches })),
    ];

    return allMatches;
}
