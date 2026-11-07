import { describe, expect, it } from "vitest";
import type { Match } from "../interfaces/match.js";
import {
    countTies,
    generateKnockoutRound,
    getKnockoutWinners,
    getMatchWinner,
} from "./knockout.js";

function m(
    homeTeam: string,
    awayTeam: string,
    homeGoals: number | null,
    awayGoals: number | null,
    pens?: [number, number],
): Match {
    const match: Match = { homeTeam, awayTeam, homeGoals, awayGoals };
    if (pens) {
        match.homePenalties = pens[0];
        match.awayPenalties = pens[1];
    }
    return match;
}

describe("generateKnockoutRound", () => {
    const pairings = [
        { homeTeam: "A", awayTeam: "B" },
        { homeTeam: "C", awayTeam: "D" },
    ];

    it("creates one match per tie for single-leg rounds", () => {
        const round = generateKnockoutRound(pairings, 1);
        expect(round.matches.map((x) => [x.homeTeam, x.awayTeam, x.tieIndex])).toEqual([
            ["A", "B", 0],
            ["C", "D", 1],
        ]);
        expect(countTies(round, 1)).toBe(2);
    });

    it("creates alternating legs with swapped venues for two-leg rounds", () => {
        const round = generateKnockoutRound(pairings, 2);
        expect(round.matches.map((x) => [x.homeTeam, x.awayTeam, x.leg])).toEqual([
            ["A", "B", 1],
            ["B", "A", 2],
            ["C", "D", 1],
            ["D", "C", 2],
        ]);
        expect(countTies(round, 2)).toBe(2);
    });
});

describe("getMatchWinner", () => {
    it("returns the team with more goals", () => {
        expect(getMatchWinner(m("A", "B", 2, 1))).toBe("A");
        expect(getMatchWinner(m("A", "B", 0, 1))).toBe("B");
    });

    it("needs a decisive shootout after a draw", () => {
        expect(getMatchWinner(m("A", "B", 1, 1))).toBeNull();
        expect(getMatchWinner(m("A", "B", 1, 1, [4, 4]))).toBeNull();
        expect(getMatchWinner(m("A", "B", 1, 1, [3, 5]))).toBe("B");
    });

    it("returns null for unplayed matches", () => {
        expect(getMatchWinner(m("A", "B", null, null))).toBeNull();
    });
});

describe("getKnockoutWinners", () => {
    it("handles single-leg rounds and skips undecided ties", () => {
        const round = {
            matches: [m("A", "B", 3, 0), m("C", "D", 2, 2), m("E", "F", 1, 1, [2, 4])],
        };
        expect(getKnockoutWinners(round, 1)).toEqual(["A", "F"]);
    });

    it("handles two-leg rounds by aggregate", () => {
        const round = {
            matches: [m("A", "B", 1, 0), m("B", "A", 2, 0), m("C", "D", 1, 1), m("D", "C", 0, 0, [4, 3])],
        };
        expect(getKnockoutWinners(round, 2)).toEqual(["B", "D"]);
    });
});
