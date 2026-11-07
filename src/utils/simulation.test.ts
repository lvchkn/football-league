import { describe, expect, it } from "vitest";
import type { Match } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";
import {
    equalRatings,
    getUnplayedRoundIndices,
    ratingsFromSeeding,
    samplePoisson,
    simulateLeagueRounds,
    simulateScore,
    simulateShootout,
    simulateSingleMatchTie,
    simulateTwoLegTies,
    type Rng,
} from "./simulation.js";

/** Deterministic PRNG (mulberry32) so statistical tests are reproducible. */
function seeded(seed: number): Rng {
    let a = seed;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Rng that replays a fixed sequence. */
function sequence(values: number[]): Rng {
    let i = 0;
    return () => values[i++ % values.length]!;
}

function m(homeTeam: string, awayTeam: string, homeGoals: number | null = null, awayGoals: number | null = null): Match {
    return { homeTeam, awayTeam, homeGoals, awayGoals };
}

describe("samplePoisson", () => {
    it("has a mean close to lambda", () => {
        const rng = seeded(1);
        let total = 0;
        for (let i = 0; i < 20000; i++) total += samplePoisson(1.5, rng);
        expect(total / 20000).toBeCloseTo(1.5, 1);
    });
});

describe("simulateScore", () => {
    it("gives the home side an edge between equal teams", () => {
        const rng = seeded(2);
        let home = 0;
        let away = 0;
        for (let i = 0; i < 20000; i++) {
            const score = simulateScore(0, 0, rng);
            home += score.homeGoals;
            away += score.awayGoals;
        }
        expect(home).toBeGreaterThan(away);
    });

    it("favours the higher-rated team even away from home", () => {
        const rng = seeded(3);
        let strongWins = 0;
        let weakWins = 0;
        for (let i = 0; i < 5000; i++) {
            const { homeGoals, awayGoals } = simulateScore(-0.35, 0.35, rng);
            if (awayGoals > homeGoals) strongWins++;
            if (homeGoals > awayGoals) weakWins++;
        }
        expect(strongWins).toBeGreaterThan(weakWins * 2);
    });
});

describe("simulateShootout", () => {
    it("always produces a winner", () => {
        const rng = seeded(4);
        for (let i = 0; i < 2000; i++) {
            const { home, away } = simulateShootout(rng);
            expect(home).not.toBe(away);
        }
    });

    it("stops as soon as the result is decided", () => {
        // Home scores everything, away misses everything: 3-0 after three rounds
        const { home, away } = simulateShootout(sequence([0, 0.99]));
        expect([home, away]).toEqual([3, 0]);
    });

    it("goes to sudden death when level after five rounds", () => {
        // Both score five, then home scores and away misses
        const rng = sequence([...Array(10).fill(0), 0, 0.99]);
        expect(simulateShootout(rng)).toEqual({ home: 6, away: 5 });
    });
});

describe("ratingsFromSeeding", () => {
    it("rates earlier teams higher and unknown teams as average", () => {
        const ratingOf = ratingsFromSeeding(["A", "B", "C"]);
        expect(ratingOf("A")).toBeGreaterThan(ratingOf("B"));
        expect(ratingOf("B")).toBeCloseTo(0);
        expect(ratingOf("C")).toBeLessThan(0);
        expect(ratingOf("Z")).toBe(0);
    });
});

describe("simulateLeagueRounds", () => {
    it("fills only unplayed matches in the requested rounds", () => {
        const rounds: Round[] = [
            { matches: [m("A", "B", 3, 3), m("C", "D")] },
            { matches: [m("B", "C")] },
        ];

        const updates = simulateLeagueRounds(rounds, [0], equalRatings, seeded(5));

        expect(rounds[0]!.matches[0]).toMatchObject({ homeGoals: 3, awayGoals: 3 });
        expect(rounds[0]!.matches[1]!.homeGoals).not.toBeNull();
        expect(rounds[0]!.matches[1]!.awayGoals).not.toBeNull();
        expect(rounds[1]!.matches[0]!.homeGoals).toBeNull();

        expect(updates).toHaveLength(1);
        expect(updates[0]!.match).toBe(rounds[0]!.matches[1]);
        expect(updates[0]!.oldMatch).toMatchObject({ homeGoals: null, awayGoals: null });
    });
});

describe("simulateTwoLegTies", () => {
    it("settles a level aggregate with penalties on leg 2", () => {
        // Leg 1 played 1-0; leg 2 unplayed. Force leg 2 to 1-0 to level it 1-1.
        const leg1 = m("A", "B", 1, 0);
        const leg2 = m("B", "A");
        // Poisson draws for leg 2: home 0.5 then 0.15 (< e^-1.5) = 1 goal,
        // away 0.01 (< e^-1.15) = 0 goals; the rest feeds the shootout.
        const rng = sequence([0.5, 0.3, 0.01, 0, 0.99]);

        const updates = simulateTwoLegTies([leg1, leg2], equalRatings, rng);

        expect(leg2.homeGoals! + leg1.awayGoals!).toBe(leg1.homeGoals! + leg2.awayGoals!);
        expect(leg2.homePenalties).not.toBe(leg2.awayPenalties);
        expect(updates).toHaveLength(1);
        expect(updates[0]!.oldMatch).toMatchObject({ homeGoals: null, awayGoals: null });
    });

    it("leaves decided ties untouched", () => {
        const leg1 = m("A", "B", 2, 0);
        const leg2 = m("B", "A", 0, 1);
        expect(simulateTwoLegTies([leg1, leg2], equalRatings, seeded(6))).toEqual([]);
        expect(leg2.homePenalties).toBeUndefined();
    });

    it("always produces a winner for every tie", () => {
        const rng = seeded(7);
        for (let i = 0; i < 500; i++) {
            const leg1 = m("A", "B");
            const leg2 = m("B", "A");
            simulateTwoLegTies([leg1, leg2], equalRatings, rng);
            const aggA = leg1.homeGoals! + leg2.awayGoals!;
            const aggB = leg1.awayGoals! + leg2.homeGoals!;
            if (aggA === aggB) {
                expect(leg2.homePenalties).not.toBe(leg2.awayPenalties);
            }
        }
    });
});

describe("simulateSingleMatchTie", () => {
    it("adds penalties to a drawn final", () => {
        const final = m("A", "B", 2, 2);
        const updates = simulateSingleMatchTie(final, equalRatings, seeded(8));
        expect(final.homePenalties).not.toBe(final.awayPenalties);
        expect(updates).toHaveLength(1);
    });
});

describe("getUnplayedRoundIndices", () => {
    it("lists rounds with at least one missing result", () => {
        const rounds: Round[] = [
            { matches: [m("A", "B", 1, 0)] },
            { matches: [m("A", "B", 1, 0), m("C", "D")] },
            { matches: [m("A", "B")] },
        ];
        expect(getUnplayedRoundIndices(rounds)).toEqual([1, 2]);
    });
});
