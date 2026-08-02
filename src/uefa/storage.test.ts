import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    clearAll,
    getFixtures,
    getFixturesStructure,
    setFixturesImmediate,
    setFixturesStructure,
} from "./storage.js";
import type { Round } from "../interfaces/round.js";
import type { UEFACompetition } from "../interfaces/tournament.js";

const competition: UEFACompetition = "ucl";
const fixtures: Round[] = [
    {
        matches: [
            {
                homeTeam: "A",
                awayTeam: "B",
                homeGoals: null,
                awayGoals: null,
            },
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

describe("UEFA fixture storage", () => {
    beforeEach(() => {
        memoryStorage.clear();
        clearAll(competition);
    });

    afterEach(() => {
        memoryStorage.clear();
        clearAll(competition);
    });

    it("reuses saved fixtures when the roster version matches", () => {
        expect(setFixturesStructure(fixtures, competition, "version-1")).toBe(true);
        expect(getFixturesStructure(competition, "version-1")).toEqual([
            [{ homeTeam: "A", awayTeam: "B", leg: null, tieIndex: null }],
        ]);

        expect(setFixturesImmediate(fixtures, competition, "version-1")).toBe(true);
        expect(getFixtures(competition, "version-1")).toEqual([
            [{ homeTeam: "A", awayTeam: "B", homeGoals: null, awayGoals: null }],
        ]);
    });

    it("invalidates persisted fixtures when the roster version changes", () => {
        setFixturesStructure(fixtures, competition, "version-1");
        setFixturesImmediate(fixtures, competition, "version-1");

        memoryStorage.setItem(
            "football-league:uefa:fixtures-version:ucl",
            "stale-version",
        );

        expect(getFixturesStructure(competition, "version-2")).toBeNull();
        expect(getFixtures(competition, "version-2")).toBeNull();
        expect(memoryStorage.getItem("football-league:uefa:fixtures:ucl")).toBeNull();
        expect(
            memoryStorage.getItem("football-league:uefa:fixtures-structure:ucl"),
        ).toBeNull();
    });
});
