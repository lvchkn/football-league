import { describe, expect, it } from "vitest";
import type { LeaguePhase } from "../interfaces/round.js";
import type { LeagueList, Teams } from "../interfaces/tournament.js";
import { generateFixtures } from "../domestic/fixtures.js";
import { equalRatings, type Rng } from "../utils/simulation.js";
import { applyPyramid, completeLeague, endSeason } from "./season.js";
import { newCareer } from "./state.js";
import { PYRAMIDS } from "./rules.js";

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

const letters = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

describe("completeLeague", () => {
    it("plays every match, keeps entered results and ranks all teams", () => {
        const teams = letters("T", 6);
        const fixtures = generateFixtures(teams);
        fixtures[0]!.matches[0]!.homeGoals = 9;
        fixtures[0]!.matches[0]!.awayGoals = 0;

        const standings = completeLeague(teams, fixtures, equalRatings, seeded(1));

        expect([...standings].sort()).toEqual([...teams].sort());
        expect(fixtures.every((r) => r.matches.every((m) => m.homeGoals != null && m.awayGoals != null))).toBe(true);
        expect(fixtures[0]!.matches[0]).toMatchObject({ homeGoals: 9, awayGoals: 0 });
    });
});

describe("applyPyramid", () => {
    const top = letters("P", 20);
    const second = letters("C", 24);

    it("swaps the bottom and top three, keeping league sizes", () => {
        const out = applyPyramid({ top: "english", second: "english-2", direct: 3 }, top, second);
        expect(out.relegated).toEqual(["P18", "P19", "P20"]);
        expect(out.promoted).toEqual(["C1", "C2", "C3"]);
        expect(out.top).toEqual([...letters("P", 17), "C1", "C2", "C3"]);
        expect(out.second).toEqual(["P18", "P19", "P20", ...letters("C", 24).slice(3)]);
        expect(out.playoff).toBeUndefined();
    });

    it("adds a play-off between the next teams that always has a winner", () => {
        const rule = { top: "german", second: "german-2", direct: 2, playoff: true } as const;
        const top18 = letters("B", 18);
        const second18 = letters("Z", 18);
        const outcomes = new Set<string>();
        for (let seed = 0; seed < 200; seed++) {
            const out = applyPyramid(rule, top18, second18, seeded(seed));
            expect(out.playoff!.topTeam).toBe("B16");
            expect(out.playoff!.secondTeam).toBe("Z3");
            expect(["B16", "Z3"]).toContain(out.playoff!.winner);
            expect(out.top).toHaveLength(18);
            expect(out.second).toHaveLength(18);
            expect(out.top.includes("Z3")).toBe(out.playoff!.winner === "Z3");
            outcomes.add(out.playoff!.winner);
        }
        expect(outcomes.size).toBe(2);
    });
});

describe("endSeason", () => {
    it("completes partly played leagues and produces a consistent next season", () => {
        const state = newCareer();
        const fixturesByLeague = new Map<LeagueList, LeaguePhase>();
        const loadFixtures = (league: LeagueList, teams: Teams) => {
            const fixtures = generateFixtures(teams);
            fixturesByLeague.set(league, fixtures);
            return fixtures;
        };

        const { next, summary } = endSeason(state, { loadFixtures, uefaWinner: (c) => (c === "ucl" ? "Arsenal" : null) }, seeded(7));

        expect(next.season).toBe(state.season + 1);
        expect(next.history).toEqual([summary]);
        expect(summary.uefaWinners).toEqual({ ucl: "Arsenal" });

        // League sizes kept, and each club still plays in exactly one league
        const leagues = Object.keys(state.rosters).filter((id) => !["ucl", "el", "cl"].includes(id)) as LeagueList[];
        leagues.forEach((l) => expect(next.rosters[l]).toHaveLength(state.rosters[l].length));
        const clubs = leagues.flatMap((l) => next.rosters[l]);
        expect(new Set(clubs).size).toBe(clubs.length);

        // Each pyramid exchanged the reported teams
        PYRAMIDS.forEach((rule) => {
            const top = summary.leagues.find((s) => s.league === rule.top)!;
            const second = summary.leagues.find((s) => s.league === rule.second)!;
            expect(top.relegated!.length).toBe(second.promoted!.length);
            second.promoted!.forEach((t) => expect(next.rosters[rule.top]).toContain(t));
            top.relegated!.forEach((t) => expect(next.rosters[rule.second]).toContain(t));
        });

        // European qualifiers come from this season's top flights
        const englandTop5 = summary.leagues.find((s) => s.league === "english")!;
        expect(next.rosters.ucl).toContain(englandTop5.champion);
        expect(next.rosters.ucl).toHaveLength(36);
        expect(next.strength.english).toEqual(next.rosters.english);
        // every played fixture was completed
        fixturesByLeague.forEach((f) => expect(f.every((r) => r.matches.every((m) => m.homeGoals != null))).toBe(true));
    });
});
