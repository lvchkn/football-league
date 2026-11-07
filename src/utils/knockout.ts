import type { KnockoutMatch, Match, Pairing } from "../interfaces/match.js";
import type { KnockoutRound } from "../interfaces/round.js";

export type Legs = 1 | 2;

/**
 * Build a knockout round from pairings.
 * Two legs: the first team hosts leg 1, the second hosts leg 2; matches
 * alternate leg 1, leg 2. One leg: the first team is the nominal home side.
 */
export function generateKnockoutRound(pairings: Pairing[], legs: Legs): KnockoutRound {
    const matches: KnockoutMatch[] = [];

    pairings.forEach(function (pair, tieIndex) {
        matches.push({
            homeTeam: pair.homeTeam,
            awayTeam: pair.awayTeam,
            homeGoals: null,
            awayGoals: null,
            leg: 1,
            tieIndex,
        });

        if (legs === 2) {
            matches.push({
                homeTeam: pair.awayTeam,
                awayTeam: pair.homeTeam,
                homeGoals: null,
                awayGoals: null,
                leg: 2,
                tieIndex,
            });
        }
    });

    return { matches };
}

export function hasDecisivePenalties(match: Match): boolean {
    const { homePenalties, awayPenalties } = match;
    return (
        typeof homePenalties === "number" &&
        typeof awayPenalties === "number" &&
        Number.isInteger(homePenalties) &&
        Number.isInteger(awayPenalties) &&
        homePenalties >= 0 &&
        awayPenalties >= 0 &&
        homePenalties !== awayPenalties
    );
}

function _penaltyWinner(match: Match): string | null {
    if (!hasDecisivePenalties(match)) return null;
    return match.homePenalties! > match.awayPenalties! ? match.homeTeam : match.awayTeam;
}

/**
 * Winner of a single-match tie; a draw requires a decisive shootout.
 */
export function getMatchWinner(match: Match): string | null {
    if (match.homeGoals == null || match.awayGoals == null) return null;
    if (match.homeGoals > match.awayGoals) return match.homeTeam;
    if (match.awayGoals > match.homeGoals) return match.awayTeam;
    return _penaltyWinner(match);
}

/**
 * Winner of a two-leg tie; a level aggregate requires a decisive shootout in leg 2.
 */
export function getTieWinner(leg1: Match, leg2: Match): string | null {
    if (
        leg1.homeGoals == null ||
        leg1.awayGoals == null ||
        leg2.homeGoals == null ||
        leg2.awayGoals == null
    ) {
        return null;
    }

    const aggregate1 = leg1.homeGoals + leg2.awayGoals;
    const aggregate2 = leg1.awayGoals + leg2.homeGoals;

    if (aggregate1 > aggregate2) return leg1.homeTeam;
    if (aggregate2 > aggregate1) return leg1.awayTeam;
    return _penaltyWinner(leg2);
}

/**
 * Number of ties in a knockout round.
 */
export function countTies(round: KnockoutRound | { matches: Match[] }, legs: Legs): number {
    return Math.floor(round.matches.length / legs);
}

/**
 * Winners of every decided tie, in tie order. Undecided ties are skipped,
 * so callers compare the length with countTies() to detect missing results.
 */
export function getKnockoutWinners(
    round: KnockoutRound | { matches: Match[] },
    legs: Legs = 2,
): string[] {
    const winners: string[] = [];
    const { matches } = round;

    for (let i = 0; i + legs - 1 < matches.length; i += legs) {
        const winner =
            legs === 2 ? getTieWinner(matches[i]!, matches[i + 1]!) : getMatchWinner(matches[i]!);
        if (winner) winners.push(winner);
    }

    return winners;
}
