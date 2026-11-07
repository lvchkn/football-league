import type { Match, MatchUpdate } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";

/** Returns a float in [0, 1), like Math.random. Injectable for tests. */
export type Rng = () => number;

/** Team rating where 0 is average; positive is stronger. */
export type RatingOf = (team: string) => number;

/** Average goals per game for the home and away side between equal teams. */
const BASE_HOME_GOALS = 1.5;
const BASE_AWAY_GOALS = 1.15;

/** Ratings at either end of a seeded list (strongest / weakest). */
const MAX_RATING = 0.35;

const PENALTY_CONVERSION = 0.75;

export const equalRatings: RatingOf = () => 0;

/**
 * Ratings from a list ordered strongest-first (e.g. UEFA pots), spread
 * linearly from +MAX_RATING to -MAX_RATING. Unknown teams rate as average.
 */
export function ratingsFromSeeding(seededTeams: string[]): RatingOf {
    const ratings = new Map<string, number>();
    const last = seededTeams.length - 1;

    seededTeams.forEach(function (team, index) {
        const rating = last > 0 ? MAX_RATING - (2 * MAX_RATING * index) / last : 0;
        ratings.set(team, rating);
    });

    return (team) => ratings.get(team) ?? 0;
}

/**
 * Sample a Poisson-distributed integer (Knuth's method; fine for small lambda).
 */
export function samplePoisson(lambda: number, rng: Rng): number {
    const limit = Math.exp(-lambda);
    let k = 0;
    let p = rng();

    while (p > limit) {
        k++;
        p *= rng();
    }

    return k;
}

/**
 * Simulate a full-time score. The rating gap scales each side's expected goals.
 */
export function simulateScore(
    homeRating: number,
    awayRating: number,
    rng: Rng,
): { homeGoals: number; awayGoals: number } {
    const gap = homeRating - awayRating;

    return {
        homeGoals: samplePoisson(BASE_HOME_GOALS * Math.exp(gap), rng),
        awayGoals: samplePoisson(BASE_AWAY_GOALS * Math.exp(-gap), rng),
    };
}

/**
 * Simulate a shootout: five kicks each, then sudden death. Always decisive.
 * Stops early once one side can no longer catch up, as in real shootouts.
 */
export function simulateShootout(rng: Rng): { home: number; away: number } {
    let home = 0;
    let away = 0;

    // Decided once one side's lead exceeds what the other can still score
    const decided = (homeKicksLeft: number, awayKicksLeft: number) =>
        home > away + awayKicksLeft || away > home + homeKicksLeft;

    for (let kick = 0; kick < 5; kick++) {
        if (rng() < PENALTY_CONVERSION) home++;
        if (decided(4 - kick, 5 - kick)) break;

        if (rng() < PENALTY_CONVERSION) away++;
        if (decided(4 - kick, 4 - kick)) break;
    }

    while (home === away) {
        const homeScores = rng() < PENALTY_CONVERSION;
        const awayScores = rng() < PENALTY_CONVERSION;
        if (homeScores) home++;
        if (awayScores) away++;
    }

    return { home, away };
}

function _isPlayed(match: Match): boolean {
    return match.homeGoals != null && match.awayGoals != null;
}

function _hasDecisivePenalties(match: Match): boolean {
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

/**
 * Records the pre-change state of each touched match exactly once, so a
 * match that gets both a score and penalties yields a single update.
 */
class UpdateTracker {
    private readonly originals = new Map<Match, Match>();

    touch(match: Match): void {
        if (!this.originals.has(match)) {
            this.originals.set(match, { ...match });
        }
    }

    updates(): MatchUpdate[] {
        return [...this.originals].map(([match, oldMatch]) => ({ match, oldMatch }));
    }
}

function _fillScore(match: Match, ratingOf: RatingOf, rng: Rng, tracker: UpdateTracker): void {
    if (_isPlayed(match)) return;

    tracker.touch(match);
    const score = simulateScore(ratingOf(match.homeTeam), ratingOf(match.awayTeam), rng);
    match.homeGoals = score.homeGoals;
    match.awayGoals = score.awayGoals;
}

function _fillPenalties(match: Match, rng: Rng, tracker: UpdateTracker): void {
    if (_hasDecisivePenalties(match)) return;

    tracker.touch(match);
    const shootout = simulateShootout(rng);
    match.homePenalties = shootout.home;
    match.awayPenalties = shootout.away;
}

/**
 * Fill every unplayed match in the given rounds. Entered results are kept.
 * Mutates the matches and returns one update per changed match.
 */
export function simulateLeagueRounds(
    rounds: Round[],
    roundIndices: number[],
    ratingOf: RatingOf,
    rng: Rng = Math.random,
): MatchUpdate[] {
    const tracker = new UpdateTracker();

    roundIndices.forEach(function (index) {
        rounds[index]?.matches.forEach(function (match) {
            _fillScore(match, ratingOf, rng, tracker);
        });
    });

    return tracker.updates();
}

/**
 * Fill unplayed legs of two-leg ties (matches alternate leg 1, leg 2) and
 * settle level aggregates with a shootout recorded on leg 2.
 */
export function simulateTwoLegTies(
    matches: Match[],
    ratingOf: RatingOf,
    rng: Rng = Math.random,
): MatchUpdate[] {
    const tracker = new UpdateTracker();

    for (let i = 0; i + 1 < matches.length; i += 2) {
        const leg1 = matches[i]!;
        const leg2 = matches[i + 1]!;

        _fillScore(leg1, ratingOf, rng, tracker);
        _fillScore(leg2, ratingOf, rng, tracker);

        const aggregateHome = leg1.homeGoals! + leg2.awayGoals!;
        const aggregateAway = leg1.awayGoals! + leg2.homeGoals!;

        if (aggregateHome === aggregateAway) {
            _fillPenalties(leg2, rng, tracker);
        }
    }

    return tracker.updates();
}

/**
 * Fill a single-match tie (e.g. the final), going to penalties on a draw.
 */
export function simulateSingleMatchTie(
    match: Match,
    ratingOf: RatingOf,
    rng: Rng = Math.random,
): MatchUpdate[] {
    const tracker = new UpdateTracker();

    _fillScore(match, ratingOf, rng, tracker);
    if (match.homeGoals === match.awayGoals) {
        _fillPenalties(match, rng, tracker);
    }

    return tracker.updates();
}

/**
 * Fill a knockout round of one- or two-leg ties, settling draws on penalties.
 */
export function simulateKnockoutRound(
    matches: Match[],
    legs: 1 | 2,
    ratingOf: RatingOf,
    rng: Rng = Math.random,
): MatchUpdate[] {
    if (legs === 2) return simulateTwoLegTies(matches, ratingOf, rng);
    return matches.flatMap((match) => simulateSingleMatchTie(match, ratingOf, rng));
}

/**
 * Indices of rounds that still contain at least one unplayed match.
 */
export function getUnplayedRoundIndices(rounds: Round[]): number[] {
    return rounds.flatMap((round, index) =>
        round.matches.some((match) => !_isPlayed(match)) ? [index] : [],
    );
}
