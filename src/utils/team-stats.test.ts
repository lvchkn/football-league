import { describe, expect, it } from "vitest";
import type { Round } from "../interfaces/round.js";
import {
    getForm,
    getRecordsByOpponent,
    getSplits,
    getTeamResults,
} from "./team-stats.js";

function m(
    homeTeam: string,
    awayTeam: string,
    homeGoals: number | null,
    awayGoals: number | null,
) {
    return { homeTeam, awayTeam, homeGoals, awayGoals };
}

const rounds: Round[] = [
    { matches: [m("A", "B", 2, 0), m("C", "D", 1, 1)] },
    { matches: [m("B", "C", null, null), m("D", "A", 3, 1)] },
    { matches: [m("A", "C", 1, 1), m("B", "D", 0, 2)] },
    { matches: [m("B", "A", 0, 4), m("D", "C", 0, 0)] },
];

describe("getTeamResults", () => {
    it("returns played matches from the team's perspective in matchday order", () => {
        expect(getTeamResults(rounds, "A")).toEqual([
            { matchday: 1, opponent: "B", venue: "H", goalsFor: 2, goalsAgainst: 0, outcome: "W" },
            { matchday: 2, opponent: "D", venue: "A", goalsFor: 1, goalsAgainst: 3, outcome: "L" },
            { matchday: 3, opponent: "C", venue: "H", goalsFor: 1, goalsAgainst: 1, outcome: "D" },
            { matchday: 4, opponent: "B", venue: "A", goalsFor: 4, goalsAgainst: 0, outcome: "W" },
        ]);
    });

    it("skips unplayed matches", () => {
        expect(getTeamResults(rounds, "B").map((r) => r.matchday)).toEqual([1, 3, 4]);
    });

    it("returns nothing for an unknown team", () => {
        expect(getTeamResults(rounds, "Z")).toEqual([]);
    });
});

describe("getForm", () => {
    it("keeps only the most recent results, oldest first", () => {
        const results = getTeamResults(rounds, "A");
        expect(getForm(results, 2).map((r) => r.outcome)).toEqual(["D", "W"]);
        expect(getForm(results).map((r) => r.outcome)).toEqual(["W", "L", "D", "W"]);
    });
});

describe("getSplits", () => {
    it("separates home and away records", () => {
        const { overall, home, away } = getSplits(getTeamResults(rounds, "A"));
        expect(overall).toEqual({ played: 4, wins: 2, draws: 1, losses: 1, gf: 8, ga: 4, points: 7 });
        expect(home).toEqual({ played: 2, wins: 1, draws: 1, losses: 0, gf: 3, ga: 1, points: 4 });
        expect(away).toEqual({ played: 2, wins: 1, draws: 0, losses: 1, gf: 5, ga: 3, points: 3 });
    });
});

describe("getRecordsByOpponent", () => {
    it("aggregates both meetings against the same opponent", () => {
        const records = getRecordsByOpponent(getTeamResults(rounds, "A"));
        expect(records.map((r) => r.opponent)).toEqual(["B", "D", "C"]);

        const vsB = records[0]!;
        expect(vsB.played).toBe(2);
        expect(vsB.wins).toBe(2);
        expect(vsB.gf).toBe(6);
        expect(vsB.ga).toBe(0);
        expect(vsB.results.map((r) => r.venue)).toEqual(["H", "A"]);
    });
});
