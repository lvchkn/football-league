import { describe, expect, it } from "vitest";
import * as domestic from "./domestic/teams.js";
import {
    COMPETITIONS,
    DOMESTIC_LEAGUES,
    getRosterVersion,
    isCompetition,
    isTournament,
} from "./competitions.js";

describe("competition registry", () => {
    it("wires each domestic league to the data with the same key", () => {
        const leagues = Object.values(domestic);
        expect(leagues).toHaveLength(Object.keys(DOMESTIC_LEAGUES).length);
        leagues.forEach((league) => {
            expect(DOMESTIC_LEAGUES[league.key].teams).toBe(league.teams);
            expect(DOMESTIC_LEAGUES[league.key].name).toBe(league.name);
        });
    });

    it("has unique ids, and every competition has teams and a roster version", () => {
        const ids = COMPETITIONS.map(([id]) => id);
        expect(new Set(ids).size).toBe(ids.length);
        COMPETITIONS.forEach(([id, info]) => {
            expect(info.teams.length).toBeGreaterThan(0);
            expect(getRosterVersion(id)).toBeTruthy();
        });
    });

    it("recognises ids", () => {
        expect(isTournament("wc")).toBe(true);
        expect(isTournament("english")).toBe(false);
        expect(isCompetition("english-2")).toBe(true);
        expect(isCompetition("toString")).toBe(false);
        expect(isCompetition("nonsense")).toBe(false);
    });
});
