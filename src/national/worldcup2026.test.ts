import { describe, expect, it } from "vitest";
import type { TableRow } from "../interfaces/table.js";
import { generateStageFixtures, getNextStage } from "../tournament-format.js";
import { countTies, getKnockoutWinners } from "../utils/knockout.js";
import { computeGroupTables, drawGroups, isValidDraw, pairAdjacent } from "../utils/groups.js";
import { equalRatings, simulateKnockoutRound, simulateLeagueRounds } from "../utils/simulation.js";
import {
    WC_2026_DRAW_RULES,
    WC_2026_FORMAT,
    WC_2026_GROUPS,
    WC_2026_POTS,
    WC_2026_TEAMS,
    getConfederation,
    wc2026RoundOf32,
} from "./worldcup2026.js";
import { WC_2026_THIRD_PLACE_OPPONENTS } from "./worldcup2026-thirds.js";

function seeded(seed: number) {
    let x = seed;
    return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

function row(team: string, points: number): TableRow {
    return { team, points, gf: 3, ga: 3, wins: 1, gd: 0, played: 3, draws: 1, losses: 1, h2h: {} };
}

/**
 * Final 2026 group order: winner, runner-up, third. Thirds from B, D, E, F,
 * I, J, K and L qualified; for the other groups any remaining team will do.
 */
const ACTUAL: Record<string, [string, string, string | null]> = {
    A: ["Mexico", "South Africa", null],
    B: ["Switzerland", "Canada", "Bosnia and Herzegovina"],
    C: ["Brazil", "Morocco", null],
    D: ["United States", "Australia", "Paraguay"],
    E: ["Germany", "Ivory Coast", "Ecuador"],
    F: ["Netherlands", "Japan", "Sweden"],
    G: ["Belgium", "Egypt", null],
    H: ["Spain", "Cape Verde", null],
    I: ["France", "Norway", "Senegal"],
    J: ["Argentina", "Austria", "Algeria"],
    K: ["Colombia", "Portugal", "DR Congo"],
    L: ["England", "Croatia", "Ghana"],
};

function actualTables(): Record<string, TableRow[]> {
    return Object.fromEntries(
        Object.entries(ACTUAL).map(([group, [first, second, third]]) => {
            const rest = WC_2026_GROUPS[group]!.filter((t) => ![first, second, third].includes(t));
            const thirdTeam = third ?? rest[0]!;
            const fourth = rest.find((t) => t !== thirdTeam)!;
            return [group, [row(first, 9), row(second, 6), row(thirdTeam, third ? 4 : 1), row(fourth, 0)]];
        }),
    );
}

function checkDraw(groups: Record<string, string[]>) {
    expect(isValidDraw(groups, Object.keys(WC_2026_GROUPS), WC_2026_TEAMS)).toBe(true);

    Object.entries(groups).forEach(([letter, teams]) => {
        // One team per pot, in the position the procedure assigns
        teams.forEach((team, position) => {
            const pot = WC_2026_POTS.findIndex((p) => p.includes(team));
            expect(WC_2026_DRAW_RULES.positionOf!(letter, pot)).toBe(position);
        });

        const confs = teams.map(getConfederation);
        const uefa = confs.filter((c) => c === "UEFA").length;
        expect(uefa).toBeGreaterThanOrEqual(1);
        expect(uefa).toBeLessThanOrEqual(2);
        const others = confs.filter((c) => c !== "UEFA");
        expect(new Set(others).size).toBe(others.length);
    });

    expect(groups["A"]![0]).toBe("Mexico");
    expect(groups["B"]![0]).toBe("Canada");
    expect(groups["D"]![0]).toBe("United States");
}

describe("World Cup 2026 data", () => {
    it("has 48 teams in four pots of twelve, each with a confederation", () => {
        expect(WC_2026_POTS.map((p) => p.length)).toEqual([12, 12, 12, 12]);
        expect(new Set(WC_2026_TEAMS).size).toBe(48);
        WC_2026_TEAMS.forEach((team) => expect(getConfederation(team)).toBeDefined());
    });

    it("the real draw satisfies every draw rule", () => {
        checkDraw(WC_2026_GROUPS);
    });

    it("has all 495 third-place combinations, none pitting a winner against its own group", () => {
        const entries = Object.entries(WC_2026_THIRD_PLACE_OPPONENTS);
        expect(entries).toHaveLength(495);
        entries.forEach(([key, opponents]) => {
            expect([...opponents].sort().join("")).toBe(key);
            [..."ABDEGIKL"].forEach((winner, i) => expect(opponents[i]).not.toBe(winner));
        });
    });
});

describe("wc2026RoundOf32", () => {
    it("reproduces the real 2026 round of 32", () => {
        const ties = pairAdjacent(wc2026RoundOf32(actualTables())).map((p) => `${p.homeTeam} v ${p.awayTeam}`);
        expect(ties).toEqual([
            "Germany v Paraguay",
            "France v Sweden",
            "South Africa v Canada",
            "Netherlands v Morocco",
            "Portugal v Croatia",
            "Spain v Austria",
            "United States v Bosnia and Herzegovina",
            "Belgium v Senegal",
            "Brazil v Japan",
            "Ivory Coast v Norway",
            "Mexico v Ecuador",
            "England v DR Congo",
            "Argentina v Cape Verde",
            "Australia v Egypt",
            "Switzerland v Algeria",
            "Colombia v Ghana",
        ]);
    });

    it("pairs round-of-32 winners into the real round of 16", () => {
        // Real round-of-32 winners, in bracket order
        const winners = [
            "Paraguay", "France", "Canada", "Morocco", "Portugal", "Spain", "United States", "Belgium",
            "Norway", "Brazil", "Mexico", "England", "Argentina", "Egypt", "Switzerland", "Colombia",
        ];
        expect(pairAdjacent(winners).map((p) => `${p.homeTeam} v ${p.awayTeam}`)).toEqual([
            "Paraguay v France",
            "Canada v Morocco",
            "Portugal v Spain",
            "United States v Belgium",
            "Norway v Brazil",
            "Mexico v England",
            "Argentina v Egypt",
            "Switzerland v Colombia",
        ]);
    });
});

describe("World Cup 2026 redraw", () => {
    it("always produces a legal draw", () => {
        for (let seed = 1; seed <= 100; seed++) {
            const groups = drawGroups(WC_2026_POTS, Object.keys(WC_2026_GROUPS), WC_2026_DRAW_RULES, seeded(seed));
            checkDraw(groups);
        }
    });
});

describe("WC_2026_FORMAT", () => {
    it("plays from the group stage to a champion with 16, 8, 4, 2, 1 knockout ties", () => {
        const rng = seeded(11);
        const groupStage = WC_2026_FORMAT.stages[0]!;
        if (groupStage.kind !== "groups") throw new Error("expected groups");

        const fixtures = generateStageFixtures(groupStage, WC_2026_TEAMS, {});
        expect(fixtures.map((r) => r.matches.length)).toEqual([24, 24, 24]);
        expect(fixtures[1]!.matches.slice(0, 2).map((m) => `${m.homeTeam} v ${m.awayTeam}`)).toEqual([
            "Czechia v South Africa",
            "Mexico v South Korea",
        ]);
        simulateLeagueRounds(fixtures, [0, 1, 2], equalRatings, rng);

        let context = groupStage.advance(computeGroupTables(WC_2026_GROUPS, fixtures), {});
        expect(new Set(context.qualifiedTeams).size).toBe(32);

        let stage = getNextStage(WC_2026_FORMAT, "groups");
        const ties: number[] = [];
        while (stage && stage.kind === "knockout") {
            const round = generateStageFixtures(stage, WC_2026_TEAMS, context)[0]!;
            simulateKnockoutRound(round.matches, 1, equalRatings, rng);
            ties.push(countTies(round, 1));
            const winners = getKnockoutWinners(round, 1);
            expect(winners).toHaveLength(countTies(round, 1));
            const next = getNextStage(WC_2026_FORMAT, stage.phase);
            if (next) context = stage.advance!(winners, context);
            stage = next;
        }
        expect(ties).toEqual([16, 8, 4, 2, 1]);
    });
});
