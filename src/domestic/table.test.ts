import type { Table } from "../interfaces/table.js";
import type { Match } from "../interfaces/match.js";
import { describe, it, expect, beforeEach } from "vitest";
import {
    initTable,
    applyMatchResult,
    removeMatchResult,
    sortTable,
} from "./table.js";

const Arsenal = "Arsenal";
const Liverpool = "Liverpool";
const ManchesterUnited = "Manchester United";

describe("League Table Logic", () => {
    describe("initTable", () => {
        it("should initialize a table with 0 values for all teams", () => {
            const teams = [Arsenal, Liverpool];
            const table = initTable(teams);

            expect(Object.keys(table)).toHaveLength(2);
            expect(table[Arsenal]).toEqual({
                team: Arsenal,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0,
                h2h: {},
            });
            expect(table[Liverpool]).toBeDefined();
        });
    });

    describe("applyMatchResult", () => {
        let table: Table;

        beforeEach(() => {
            table = initTable([Arsenal, Liverpool]);
        });

        it("should properly apply a home win", () => {
            const match: Match = {
                homeTeam: Arsenal,
                awayTeam: Liverpool,
                homeGoals: 2,
                awayGoals: 0,
            };
            applyMatchResult(match, table);

            expect(table[Arsenal].points).toBe(3);
            expect(table[Arsenal].wins).toBe(1);
            expect(table[Arsenal].gf).toBe(2);
            expect(table[Arsenal].ga).toBe(0);
            expect(table[Arsenal].played).toBe(1);

            expect(table[Liverpool].points).toBe(0);
            expect(table[Liverpool].losses).toBe(1);
            expect(table[Liverpool].gf).toBe(0);
            expect(table[Liverpool].ga).toBe(2);
            expect(table[Liverpool].played).toBe(1);
        });

        it("should properly apply an away win", () => {
            const match: Match = {
                homeTeam: Arsenal,
                awayTeam: Liverpool,
                homeGoals: 1,
                awayGoals: 3,
            };
            applyMatchResult(match, table);

            expect(table[Arsenal].points).toBe(0);
            expect(table[Arsenal].losses).toBe(1);

            expect(table[Liverpool].points).toBe(3);
            expect(table[Liverpool].wins).toBe(1);
            expect(table[Liverpool].gf).toBe(3);
            expect(table[Liverpool].ga).toBe(1);
        });

        it("should properly apply a draw", () => {
            const match: Match = {
                homeTeam: Arsenal,
                awayTeam: Liverpool,
                homeGoals: 1,
                awayGoals: 1,
            };
            applyMatchResult(match, table);

            expect(table[Arsenal].points).toBe(1);
            expect(table[Arsenal].draws).toBe(1);
            expect(table[Liverpool].points).toBe(1);
            expect(table[Liverpool].draws).toBe(1);
        });

        it("should not apply result if goals are null", () => {
            const match: Match = {
                homeTeam: Arsenal,
                awayTeam: Liverpool,
                homeGoals: null,
                awayGoals: null,
            };
            applyMatchResult(match, table);

            expect(table[Arsenal].played).toBe(0);
            expect(table[Liverpool].played).toBe(0);
        });
    });

    describe("removeMatchResult", () => {
        let table: Table;

        beforeEach(() => {
            table = initTable([Arsenal, Liverpool]);
        });

        it("should properly remove a home win", () => {
            const match: Match = {
                homeTeam: Arsenal,
                awayTeam: Liverpool,
                homeGoals: 2,
                awayGoals: 0,
            };

            applyMatchResult(match, table);
            expect(table[Arsenal].points).toBe(3);

            removeMatchResult(match, table);

            expect(table[Arsenal].points).toBe(0);
            expect(table[Arsenal].wins).toBe(0);
            expect(table[Arsenal].gf).toBe(0);
            expect(table[Arsenal].ga).toBe(0);
            expect(table[Arsenal].played).toBe(0);

            expect(table[Liverpool].points).toBe(0);
            expect(table[Liverpool].losses).toBe(0);
            expect(table[Liverpool].played).toBe(0);
        });

        it("should properly remove a draw", () => {
            const match: Match = {
                homeTeam: Arsenal,
                awayTeam: Liverpool,
                homeGoals: 2,
                awayGoals: 2,
            };

            applyMatchResult(match, table);
            removeMatchResult(match, table);

            expect(table[Arsenal].points).toBe(0);
            expect(table[Arsenal].draws).toBe(0);
            expect(table[Liverpool].points).toBe(0);
            expect(table[Liverpool].draws).toBe(0);
        });
    });

    describe("sortTable", () => {
        it("should sort teams by points correctly", () => {
            const table = initTable([Arsenal, Liverpool, ManchesterUnited]);
            table[Arsenal].points = 3;
            table[Liverpool].points = 1;
            table[ManchesterUnited].points = 6;

            const sorted = sortTable(table);
            expect(sorted[0].team).toBe(ManchesterUnited);
            expect(sorted[1].team).toBe(Arsenal);
            expect(sorted[2].team).toBe(Liverpool);
        });

        it("should sort teams by goal difference if points are tied", () => {
            const table = initTable([Arsenal, Liverpool]);
            table[Arsenal].points = 3;
            table[Arsenal].gf = 2;
            table[Arsenal].ga = 1; // GD = 1

            table[Liverpool].points = 3;
            table[Liverpool].gf = 5;
            table[Liverpool].ga = 2; // GD = 3

            const sorted = sortTable(table);
            expect(sorted[0].team).toBe(Liverpool); // GD 3 vs GD 1
            expect(sorted[1].team).toBe(Arsenal);
        });

        it("should sort teams by goals scored if points and goal difference are tied", () => {
            const table = initTable([Arsenal, Liverpool]);
            table[Arsenal].points = 3;
            table[Arsenal].gf = 3;
            table[Arsenal].ga = 2; // GD = 1

            table[Liverpool].points = 3;
            table[Liverpool].gf = 2;
            table[Liverpool].ga = 1; // GD = 1

            const sorted = sortTable(table);
            expect(sorted[0].team).toBe(Arsenal); // GF 3 vs GF 2
            expect(sorted[1].team).toBe(Liverpool);
        });
    });
});
