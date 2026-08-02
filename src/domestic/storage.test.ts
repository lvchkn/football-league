import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    clearAll,
    getFixtures,
    getFixturesStructure,
    setFixturesImmediate,
    setFixturesStructure,
} from "./storage.js";
import type { LeaguePhase } from "../interfaces/round.js";
import type { LeagueList } from "../interfaces/tournament.js";

const league: LeagueList = "english";
const fixtures: LeaguePhase = [
    {
        matches: [
            { homeTeam: "A", awayTeam: "B", homeGoals: null, awayGoals: null },
        ],
    },
];

class MemoryStorage {
    private store = new Map<string, string>();

    getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null;
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }
}

const memoryStorage = new MemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
});

describe("domestic fixture storage", () => {
    beforeEach(() => {
        memoryStorage.clear();
        clearAll(league);
    });

    afterEach(() => {
        memoryStorage.clear();
        clearAll(league);
    });

    it("reuses saved fixtures when the roster version matches", () => {
        expect(setFixturesStructure(fixtures, league)).toBe(true);
        expect(getFixturesStructure(league)).toEqual([
            [{ homeTeam: "A", awayTeam: "B" }],
        ]);

        expect(setFixturesImmediate(fixtures, league)).toBe(true);
        expect(getFixtures(league)).toEqual([[null]]);
    });

    it("invalidates persisted fixtures when the roster version changes", () => {
        setFixturesStructure(fixtures, league);
        setFixturesImmediate(fixtures, league);

        memoryStorage.setItem("football-league:fixtures-version:english", "stale-version");

        expect(getFixturesStructure(league)).toBeNull();
        expect(getFixtures(league)).toBeNull();
        expect(memoryStorage.getItem("football-league:fixtures:english")).toBeNull();
        expect(memoryStorage.getItem("football-league:fixtures-structure:english")).toBeNull();
    });
});
