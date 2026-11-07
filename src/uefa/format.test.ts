import { describe, expect, it } from "vitest";
import type { KnockoutMatch } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";
import type { KnockoutStage, Teams, StageContext } from "../interfaces/tournament.js";
import { generateStageFixtures, getNextStage, getPhaseLabel, getStage } from "../tournament/format.js";
import { countTies, getKnockoutWinners } from "../utils/knockout.js";
import { equalRatings, simulateKnockoutRound, simulateLeagueRounds, type Rng } from "../utils/simulation.js";
import { UEFA_FORMAT } from "./format.js";
import { sortLeagueStageTable } from "../tournament/league-table.js";
import { applyMatchResult, initTable } from "../utils/table.js";

function seeded(seed: number): Rng {
    let a = seed;
    return function () {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const teams: Teams = Array.from({ length: 36 }, (_, i) => `T${i + 1}`);

describe("UEFA_FORMAT", () => {
    it("lists the stages in order with their labels", () => {
        expect(UEFA_FORMAT.stages.map((s) => s.phase)).toEqual([
            "league", "playoffs", "r16", "quarterfinals", "semifinals", "final",
        ]);
        expect(getPhaseLabel(UEFA_FORMAT, "r16")).toBe("Round of 16");
        expect(getPhaseLabel(UEFA_FORMAT, "finished")).toBe("Finished");
        expect(getStage(UEFA_FORMAT, "finished")?.phase).toBe("final");
        expect(getNextStage(UEFA_FORMAT, "final")).toBeUndefined();
    });

    it("plays out a full competition from league phase to a single champion", () => {
        const rng = seeded(42);
        let stage = UEFA_FORMAT.stages[0]!;
        let context: StageContext = {};
        let fixtures: Round[] = generateStageFixtures(stage, teams, context);
        const tiesPerStage: Record<string, number> = {};
        let champion: string | undefined;

        for (;;) {
            let qualified: Teams;

            if (stage.kind === "league") {
                simulateLeagueRounds(fixtures, fixtures.map((_, i) => i), equalRatings, rng);
                const table = initTable(teams);
                fixtures.forEach((r) => r.matches.forEach((m) => applyMatchResult(m, table)));
                qualified = sortLeagueStageTable(table).map((row) => row.team);
            } else if (stage.kind === "knockout") {
                const round = fixtures[0]!;
                simulateKnockoutRound(round.matches, stage.legs, equalRatings, rng);
                tiesPerStage[stage.phase] = countTies(round, stage.legs);
                qualified = getKnockoutWinners(round, stage.legs);
                expect(qualified).toHaveLength(tiesPerStage[stage.phase]!);
            } else {
                throw new Error("UEFA format has no group stage");
            }

            const next = getNextStage(UEFA_FORMAT, stage.phase);
            if (!next) {
                champion = qualified[0];
                break;
            }

            context =
                stage.kind === "league"
                    ? stage.advance(qualified, context)
                    : (stage as KnockoutStage).advance!(qualified, context);

            if (stage.phase === "league") {
                expect(context.top8).toEqual(qualified.slice(0, 8));
                expect(context.playoffTeams).toEqual(qualified.slice(8, 24));
            }

            stage = next;
            fixtures = generateStageFixtures(stage, teams, context);

            if (stage.phase === "r16") {
                // Every top-8 side hosts the second leg against a playoff winner
                const matches = fixtures[0]!.matches as KnockoutMatch[];
                const leg2Hosts = matches.filter((m) => m.leg === 2).map((m) => m.homeTeam);
                expect(leg2Hosts.sort()).toEqual([...context.top8!].sort());
            }
        }

        expect(tiesPerStage).toEqual({
            playoffs: 8,
            r16: 8,
            quarterfinals: 4,
            semifinals: 2,
            final: 1,
        });
        expect(teams).toContain(champion);
    });
});
