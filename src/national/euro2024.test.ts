import { describe, expect, it } from "vitest";
import type { TableRow } from "../interfaces/table.js";
import { generateStageFixtures, getNextStage } from "../tournament-format.js";
import { countTies, getKnockoutWinners } from "../utils/knockout.js";
import { computeGroupTables, pairAdjacent } from "../utils/groups.js";
import { equalRatings, simulateKnockoutRound, simulateLeagueRounds, type Rng } from "../utils/simulation.js";
import { EURO_2024_FORMAT, EURO_2024_GROUPS, EURO_2024_TEAMS, euro2024RoundOf16 } from "./euro2024.js";

function row(team: string, points: number, gf: number, ga: number, wins: number): TableRow {
    return { team, points, gf, ga, wins, gd: gf - ga, played: 3, draws: 0, losses: 0, h2h: {} };
}

/** Final Euro 2024 group tables (Denmark edged Slovenia on disciplinary points). */
const ACTUAL_TABLES: Record<string, TableRow[]> = {
    A: [row("Germany", 7, 8, 2, 2), row("Switzerland", 5, 5, 3, 1), row("Hungary", 3, 2, 5, 1), row("Scotland", 1, 2, 7, 0)],
    B: [row("Spain", 9, 5, 0, 3), row("Italy", 4, 3, 3, 1), row("Croatia", 2, 3, 6, 0), row("Albania", 1, 3, 5, 0)],
    C: [row("England", 5, 2, 1, 1), row("Denmark", 3, 2, 2, 0), row("Slovenia", 3, 2, 2, 0), row("Serbia", 2, 1, 2, 0)],
    D: [row("Austria", 6, 6, 4, 2), row("France", 5, 2, 1, 1), row("Netherlands", 4, 4, 4, 1), row("Poland", 1, 3, 6, 0)],
    E: [row("Romania", 4, 4, 3, 1), row("Belgium", 4, 2, 1, 1), row("Slovakia", 4, 4, 4, 1), row("Ukraine", 4, 2, 4, 1)],
    F: [row("Portugal", 6, 5, 3, 2), row("Türkiye", 6, 5, 5, 2), row("Georgia", 4, 4, 4, 1), row("Czechia", 1, 3, 5, 0)],
};

describe("Euro 2024 data", () => {
    it("has 24 distinct teams split into six groups of four", () => {
        const grouped = Object.values(EURO_2024_GROUPS).flat();
        expect(grouped).toHaveLength(24);
        expect(new Set(grouped).size).toBe(24);
        expect([...EURO_2024_TEAMS].sort()).toEqual([...grouped].sort());
    });
});

describe("euro2024RoundOf16", () => {
    it("reproduces the real Euro 2024 round of 16", () => {
        const ties = pairAdjacent(euro2024RoundOf16(ACTUAL_TABLES)).map((p) => `${p.homeTeam} v ${p.awayTeam}`);
        expect(ties).toEqual([
            "Spain v Georgia",
            "Germany v Denmark",
            "Portugal v Slovenia",
            "France v Belgium",
            "Romania v Netherlands",
            "Austria v Türkiye",
            "England v Slovakia",
            "Switzerland v Italy",
        ]);
    });

    it("keeps third-placed teams away from their own group winner for every combination", () => {
        const allowed = { B: "ADEF", C: "DEF", E: "ABCD", F: "ABC" };
        const letters = ["A", "B", "C", "D", "E", "F"];

        // Every way of picking four qualifying thirds
        for (let skipA = 0; skipA < 6; skipA++) {
            for (let skipB = skipA + 1; skipB < 6; skipB++) {
                const qualifying = letters.filter((_, i) => i !== skipA && i !== skipB);
                // Make exactly these groups' thirds the best four
                const tables = Object.fromEntries(
                    letters.map((g) => [
                        g,
                        [
                            row(`1${g}`, 9, 9, 0, 3),
                            row(`2${g}`, 6, 6, 3, 2),
                            row(`3${g}`, qualifying.includes(g) ? 4 : 0, 3, 3, 1),
                            row(`4${g}`, 0, 0, 9, 0),
                        ],
                    ]),
                );

                const bracket = euro2024RoundOf16(tables);
                const opponentOf = (winner: string) => bracket[bracket.indexOf(winner) + 1]!;

                const thirdsUsed = (["B", "C", "E", "F"] as const).map(function (g) {
                    const opponent = opponentOf(`1${g}`);
                    expect(opponent.startsWith("3")).toBe(true);
                    expect(allowed[g]).toContain(opponent[1]);
                    return opponent;
                });
                expect(thirdsUsed.map((t) => t[1]).sort()).toEqual(qualifying);
            }
        }
    });
});

describe("EURO_2024_FORMAT", () => {
    it("plays from the group stage to a champion with 8, 4, 2, 1 knockout ties", () => {
        let seed = 7;
        const rng: Rng = () => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };

        const groupStage = EURO_2024_FORMAT.stages[0]!;
        if (groupStage.kind !== "groups") throw new Error("expected groups");

        const groupFixtures = generateStageFixtures(groupStage, EURO_2024_TEAMS, {});
        expect(groupFixtures.map((r) => r.matches.length)).toEqual([12, 12, 12]);
        simulateLeagueRounds(groupFixtures, [0, 1, 2], equalRatings, rng);

        let context = groupStage.advance(computeGroupTables(EURO_2024_GROUPS, groupFixtures), {});
        expect(context.qualifiedTeams).toHaveLength(16);

        let stage = getNextStage(EURO_2024_FORMAT, "groups");
        const ties: number[] = [];
        let champion: string | undefined;

        while (stage && stage.kind === "knockout") {
            const round = generateStageFixtures(stage, EURO_2024_TEAMS, context)[0]!;
            simulateKnockoutRound(round.matches, stage.legs, equalRatings, rng);
            ties.push(countTies(round, 1));
            const winners = getKnockoutWinners(round, 1);
            expect(winners).toHaveLength(countTies(round, 1));

            const next = getNextStage(EURO_2024_FORMAT, stage.phase);
            if (!next) champion = winners[0];
            else context = stage.advance!(winners, context);
            stage = next;
        }

        expect(ties).toEqual([8, 4, 2, 1]);
        expect(EURO_2024_TEAMS).toContain(champion);
    });
});
