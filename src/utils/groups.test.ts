import { describe, expect, it } from "vitest";
import type { Round } from "../interfaces/round.js";
import {
    computeGroupTables,
    drawGroups,
    isValidDraw,
    generateGroupFixtures,
    groupLookup,
    pairAdjacent,
    rankThirdPlaced,
} from "./groups.js";

const groups = {
    A: ["A1", "A2", "A3", "A4"],
    B: ["B1", "B2", "B3", "B4"],
};

function setScore(rounds: Round[], home: string, away: string, hg: number, ag: number) {
    const match = rounds.flatMap((r) => r.matches).find((m) => m.homeTeam === home && m.awayTeam === away);
    if (!match) throw new Error(`No match ${home} v ${away}`);
    match.homeGoals = hg;
    match.awayGoals = ag;
}

describe("generateGroupFixtures", () => {
    it("plays every pair in a group exactly once over three matchdays", () => {
        const rounds = generateGroupFixtures(groups);
        expect(rounds).toHaveLength(3);
        expect(rounds.map((r) => r.matches.length)).toEqual([4, 4, 4]);

        const pairs = rounds
            .flatMap((r) => r.matches)
            .filter((m) => m.homeTeam.startsWith("A"))
            .map((m) => [m.homeTeam, m.awayTeam].sort().join("-"))
            .sort();
        expect(pairs).toEqual(["A1-A2", "A1-A3", "A1-A4", "A2-A3", "A2-A4", "A3-A4"]);
    });

    it("follows the Euro order: 1v2 3v4, 1v3 2v4, 4v1 2v3", () => {
        const [md1, md2, md3] = generateGroupFixtures({ A: groups.A });
        const fmt = (r: Round) => r.matches.map((m) => `${m.homeTeam}v${m.awayTeam}`);
        expect(fmt(md1!)).toEqual(["A1vA2", "A3vA4"]);
        expect(fmt(md2!)).toEqual(["A1vA3", "A2vA4"]);
        expect(fmt(md3!)).toEqual(["A4vA1", "A2vA3"]);
    });

    it("rejects groups that are not four teams", () => {
        expect(() => generateGroupFixtures({ A: ["x", "y", "z"] })).toThrow();
    });
});

describe("groupLookup", () => {
    it("maps teams to their group letter", () => {
        const groupOf = groupLookup(groups);
        expect(groupOf("B3")).toBe("B");
        expect(groupOf("nope")).toBeUndefined();
    });
});

describe("computeGroupTables", () => {
    it("ranks each group separately, head-to-head first", () => {
        const rounds = generateGroupFixtures(groups);
        // A1 and A2 finish level on 6 points; A2 won the head-to-head
        setScore(rounds, "A1", "A2", 0, 1);
        setScore(rounds, "A3", "A4", 0, 0);
        setScore(rounds, "A1", "A3", 5, 0);
        setScore(rounds, "A2", "A4", 0, 1);
        setScore(rounds, "A4", "A1", 0, 3);
        setScore(rounds, "A2", "A3", 1, 0);

        const tables = computeGroupTables(groups, rounds);
        expect(Object.keys(tables)).toEqual(["A", "B"]);
        expect(tables["A"]!.map((r) => r.team)).toEqual(["A2", "A1", "A4", "A3"]);
        expect(tables["A"]![1]!.points).toBe(6);
        expect(tables["B"]!.every((r) => r.played === 0)).toBe(true);
    });
});

describe("rankThirdPlaced", () => {
    it("orders thirds by points, goal difference, goals, wins", () => {
        const row = (team: string, points: number, gf: number, ga: number, wins: number) => ({
            team, points, gf, ga, wins, played: 3, draws: 0, losses: 0, gd: gf - ga, h2h: {},
        });
        const filler = row("x", 9, 0, 0, 3);
        const tables = {
            A: [filler, filler, row("A3", 4, 3, 3, 1)],
            B: [filler, filler, row("B3", 4, 4, 2, 1)],
            C: [filler, filler, row("C3", 4, 4, 2, 1)],
            D: [filler, filler, row("D3", 3, 5, 1, 1)],
        };
        expect(rankThirdPlaced(tables).map((t) => t.row.team)).toEqual(["B3", "C3", "A3", "D3"]);
    });
});

describe("pairAdjacent", () => {
    it("pairs neighbours in order", () => {
        expect(pairAdjacent(["a", "b", "c", "d"])).toEqual([
            { homeTeam: "a", awayTeam: "b" },
            { homeTeam: "c", awayTeam: "d" },
        ]);
    });
});

describe("drawGroups", () => {
    const pots = [
        ["P1a", "P1b", "P1c"],
        ["P2a", "P2b", "P2c"],
        ["P3a", "P3b", "P3c"],
        ["P4a", "P4b", "P4c"],
    ];
    const letters = ["A", "B", "C"];

    it("puts exactly one team from each pot in every group", () => {
        for (let seed = 1; seed <= 50; seed++) {
            let x = seed;
            const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647);
            const groups = drawGroups(pots, letters, [], rng);

            expect(Object.keys(groups)).toEqual(letters);
            Object.values(groups).forEach((teams) => {
                expect(teams).toHaveLength(4);
                pots.forEach((pot) => expect(teams.filter((t) => pot.includes(t))).toHaveLength(1));
            });
            expect(isValidDraw(groups, letters, pots.flat())).toBe(true);
        }
    });

    it("keeps fixed slots in place", () => {
        for (let seed = 1; seed <= 50; seed++) {
            let x = seed;
            const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647);
            const groups = drawGroups(pots, letters, [{ team: "P1b", group: "A", position: 0 }], rng);
            expect(groups["A"]![0]).toBe("P1b");
        }
    });

    it("produces different draws", () => {
        const draws = new Set(
            Array.from({ length: 20 }, () => JSON.stringify(drawGroups(pots, letters))),
        );
        expect(draws.size).toBeGreaterThan(1);
    });
});

describe("isValidDraw", () => {
    const teams = ["a", "b", "c", "d", "e", "f", "g", "h"];

    it("accepts a complete draw and rejects broken ones", () => {
        expect(isValidDraw({ A: ["a", "b", "c", "d"], B: ["e", "f", "g", "h"] }, ["A", "B"], teams)).toBe(true);
        expect(isValidDraw({ A: ["a", "b", "c", "d"], B: ["e", "f", "g", "x"] }, ["A", "B"], teams)).toBe(false);
        expect(isValidDraw({ A: ["a", "b", "c", "d"] }, ["A", "B"], teams)).toBe(false);
        expect(isValidDraw({ A: ["a", "b", "c"], B: ["d", "e", "f", "g", "h"] }, ["A", "B"], teams)).toBe(false);
        expect(isValidDraw(null, ["A", "B"], teams)).toBe(false);
    });
});
