import type { Match } from "../interfaces/match.js";
import { describe, it, expect } from "vitest";
import { sortLeagueStageTable } from "./league-table.js";
import { applyMatchResult, initTable } from "../utils/table.js";

describe("League stage table", () => {
    describe("initTable", () => {
        it("should initialize a table with 0 values for all teams and empty h2h tracking", () => {
            const table = initTable(["Real Madrid", "Bayern"]);
            expect(Object.keys(table)).toHaveLength(2);
            expect(table["Real Madrid"].h2h).toEqual({});
        });
    });

    describe("applyMatchResult (H2H tracking)", () => {
        it("should properly track H2H stats between two teams", () => {
            const table = initTable(["Real Madrid", "Bayern"]);
            const match: Match = {
                homeTeam: "Real Madrid",
                awayTeam: "Bayern",
                homeGoals: 2,
                awayGoals: 1,
            };
            applyMatchResult(match, table);

            const realMadrid = table["Real Madrid"];
            const bayern = table["Bayern"];

            expect(realMadrid.points).toBe(3);
            expect(realMadrid.h2h["Bayern"].wins).toBe(1);
            expect(realMadrid.h2h["Bayern"].gf).toBe(2);

            expect(bayern.h2h["Real Madrid"].losses).toBe(1);
            expect(bayern.h2h["Real Madrid"].gf).toBe(1);
        });
    });

    describe("sortLeagueStageTable", () => {
        it("should sort by points first", () => {
            const table = initTable(["A", "B"]);
            table["A"].points = 3;
            table["B"].points = 1;

            const sorted = sortLeagueStageTable(table);

            expect(sorted[0].team).toBe("A");
        });

        it("should sort by H2H if points are equal", () => {
            const table = initTable(["A", "B"]);
            table["A"].points = 3;
            table["B"].points = 3;

            // A win over B in H2H
            table["A"].h2h["B"] = {
                played: 1,
                wins: 1,
                draws: 0,
                losses: 0,
                gf: 2,
                ga: 1,
            };
            table["B"].h2h["A"] = {
                played: 1,
                wins: 0,
                draws: 0,
                losses: 1,
                gf: 1,
                ga: 2,
            };

            const sorted = sortLeagueStageTable(table);
            expect(sorted[0].team).toBe("A");
        });

        it("should sort by Overall GD if H2H points are equal", () => {
            const table = initTable(["A", "B"]);
            table["A"].points = 3;
            table["B"].points = 3;
            table["A"].gf = 5;
            table["A"].ga = 1; // GD 4
            table["B"].gf = 6;
            table["B"].ga = 1; // GD 5

            // Draw in H2H
            table["A"].h2h["B"] = {
                played: 1,
                wins: 0,
                draws: 1,
                losses: 0,
                gf: 1,
                ga: 1,
            };
            table["B"].h2h["A"] = {
                played: 1,
                wins: 0,
                draws: 1,
                losses: 0,
                gf: 1,
                ga: 1,
            };

            const sorted = sortLeagueStageTable(table);
            expect(sorted[0].team).toBe("B"); // B has better overall GD (5 > 4)
        });
    });
});
