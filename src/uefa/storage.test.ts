import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    archivePhase,
    clearAll,
    getFixtures,
    getFixturesStructure,
    getHistory,
    setFixturesImmediate,
    setFixturesStructure,
    setPhase,
    setPhaseContext,
    setQualifiedTeams,
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
        expect(setFixturesStructure(fixtures, competition, "version-1")).toBe(
            true,
        );
        expect(getFixturesStructure(competition, "version-1")).toEqual([
            [{ homeTeam: "A", awayTeam: "B", leg: null, tieIndex: null }],
        ]);

        expect(setFixturesImmediate(fixtures, competition, "version-1")).toBe(
            true,
        );
        expect(getFixtures(competition, "version-1")).toEqual([
            [
                {
                    homeTeam: "A",
                    awayTeam: "B",
                    homeGoals: null,
                    awayGoals: null,
                },
            ],
        ]);
    });

    it("persists penalty shootout scores with fixture results", () => {
        const penaltyFixtures: Round[] = [
            {
                matches: [
                    {
                        homeTeam: "A",
                        awayTeam: "B",
                        homeGoals: 1,
                        awayGoals: 1,
                        homePenalties: 5,
                        awayPenalties: 4,
                    },
                ],
            },
        ];

        setFixturesImmediate(penaltyFixtures, competition, "version-1");

        expect(getFixtures(competition, "version-1")).toEqual([
            [
                {
                    homeTeam: "A",
                    awayTeam: "B",
                    homeGoals: 1,
                    awayGoals: 1,
                    homePenalties: 5,
                    awayPenalties: 4,
                },
            ],
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
        expect(
            memoryStorage.getItem("football-league:uefa:fixtures:ucl"),
        ).toBeNull();
        expect(
            memoryStorage.getItem(
                "football-league:uefa:fixtures-structure:ucl",
            ),
        ).toBeNull();
    });

    it("clears UEFA phase progress when fixtures are invalidated", () => {
        setFixturesStructure(fixtures, competition, "version-1");
        setFixturesImmediate(fixtures, competition, "version-1");
        setPhase(competition, "playoffs");
        setPhaseContext(competition, { playoffTeams: ["A", "B"] });
        setQualifiedTeams(competition, ["A", "B", "C"]);

        memoryStorage.setItem(
            "football-league:uefa:fixtures-version:ucl",
            "stale-version",
        );

        expect(getFixturesStructure(competition, "version-2")).toBeNull();
        expect(getFixtures(competition, "version-2")).toBeNull();
        expect(
            memoryStorage.getItem("football-league:uefa:phase:ucl"),
        ).toBeNull();
        expect(
            memoryStorage.getItem("football-league:uefa:phase-context:ucl"),
        ).toBeNull();
        expect(
            memoryStorage.getItem("football-league:uefa:qualified-teams:ucl"),
        ).toBeNull();
    });

    it("archives completed phases as independent read-only snapshots", () => {
        const completedFixtures: Round[] = [
            {
                matches: [
                    {
                        homeTeam: "A",
                        awayTeam: "B",
                        homeGoals: 1,
                        awayGoals: 1,
                        homePenalties: 5,
                        awayPenalties: 4,
                    },
                ],
            },
        ];

        expect(
            archivePhase(
                competition,
                "league",
                completedFixtures,
                "version-1",
            ),
        ).toBe(true);
        completedFixtures[0].matches[0].homeGoals = 5;

        expect(getHistory(competition, "version-1")).toEqual([
            {
                phase: "league",
                fixtures: [
                    {
                        matches: [
                            {
                                homeTeam: "A",
                                awayTeam: "B",
                                homeGoals: 1,
                                awayGoals: 1,
                                homePenalties: 5,
                                awayPenalties: 4,
                            },
                        ],
                    },
                ],
            },
        ]);
    });

    it("clears archived phase history when the roster version changes", () => {
        archivePhase(competition, "league", fixtures, "version-1");
        memoryStorage.setItem(
            "football-league:uefa:fixtures-version:ucl",
            "stale-version",
        );

        expect(getHistory(competition, "version-2")).toEqual([]);
        expect(
            memoryStorage.getItem("football-league:uefa:history:ucl"),
        ).toBeNull();
    });

    it("clears archived phase history with all UEFA progress", () => {
        archivePhase(competition, "league", fixtures, "version-1");

        clearAll(competition);

        expect(getHistory(competition, "version-1")).toEqual([]);
    });
});
