import type { Match, KnockoutMatch } from "../interfaces/match.js";
import type { KnockoutRound } from "../interfaces/round.js";
import { describe, it, expect } from "vitest";
import {
    generateLeagueFixtures,
    generateKnockoutFixtures,
    getTieWinner,
    getKnockoutWinners,
    createPlayoffPairings,
    createR16Pairings,
} from "./fixtures.js";

describe("UEFA Tournament Progressions", () => {
    describe("generateLeagueFixtures", () => {
        it("should throw an error if not exactly 36 teams are provided", () => {
            expect(() => generateLeagueFixtures(["A", "B"])).toThrow(
                "League phase requires exactly 36 teams",
            );
        });

        it("should generate 8 rounds of 18 matches each for 36 teams", () => {
            const teams = Array.from({ length: 36 }, (_, i) => `Team ${i + 1}`);
            const rounds = generateLeagueFixtures(teams);

            expect(rounds).toHaveLength(8);
            rounds.forEach((round) => {
                expect(round.matches).toHaveLength(18);
            });
        });
    });

    describe("Knockout logic", () => {
        it("should generate 2-leg knockout fixtures correctly", () => {
            const pairings = [
                { homeTeam: "Team A", awayTeam: "Team B" },
                { homeTeam: "Team C", awayTeam: "Team D" },
            ];

            const knockoutRound = generateKnockoutFixtures(pairings);

            expect(knockoutRound.matches).toHaveLength(4);

            expect(knockoutRound.matches[0].homeTeam).toBe("Team A");
            expect(knockoutRound.matches[0].leg).toBe(1);

            expect(knockoutRound.matches[1].homeTeam).toBe("Team B");
            expect(knockoutRound.matches[1].leg).toBe(2);
        });

        it("should determine getTieWinner correctly for aggregate win", () => {
            const leg1: Match = {
                homeTeam: "A",
                awayTeam: "B",
                homeGoals: 2,
                awayGoals: 0,
            };
            const leg2: Match = {
                homeTeam: "B",
                awayTeam: "A",
                homeGoals: 2,
                awayGoals: 1,
            };

            // Aggregate: A 3 - 2 B
            expect(getTieWinner(leg1, leg2)).toBe("A");

            const leg1_reverse: Match = {
                homeTeam: "A",
                awayTeam: "B",
                homeGoals: 0,
                awayGoals: 3,
            };
            const leg2_reverse: Match = {
                homeTeam: "B",
                awayTeam: "A",
                homeGoals: 1,
                awayGoals: 1,
            };

            // Aggregate: A 1 - 4 B
            expect(getTieWinner(leg1_reverse, leg2_reverse)).toBe("B");
        });

        it("should advance Leg 1 home team (higher seed) if aggregate is tied", () => {
            const leg1: Match = {
                homeTeam: "A",
                awayTeam: "B",
                homeGoals: 1,
                awayGoals: 1,
            };
            const leg2: Match = {
                homeTeam: "B",
                awayTeam: "A",
                homeGoals: 1,
                awayGoals: 1,
            };

            // Aggregate 2-2. A is leg 1 home team.
            expect(getTieWinner(leg1, leg2)).toBe("A");
        });

        it("should return getKnockoutWinners for an entire round", () => {
            const fixtures: KnockoutRound = {
                matches: [
                    {
                        homeTeam: "A",
                        awayTeam: "B",
                        homeGoals: 2,
                        awayGoals: 0,
                        leg: 1,
                        tieIndex: 0,
                    },
                    {
                        homeTeam: "B",
                        awayTeam: "A",
                        homeGoals: 0,
                        awayGoals: 0,
                        leg: 2,
                        tieIndex: 0,
                    },
                    {
                        homeTeam: "C",
                        awayTeam: "D",
                        homeGoals: 0,
                        awayGoals: 2,
                        leg: 1,
                        tieIndex: 1,
                    },
                    {
                        homeTeam: "D",
                        awayTeam: "C",
                        homeGoals: 0,
                        awayGoals: 0,
                        leg: 2,
                        tieIndex: 1,
                    },
                ] as KnockoutMatch[],
            };

            const winners = getKnockoutWinners(fixtures);
            expect(winners).toEqual(["A", "D"]);
        });
    });

    describe("Pairing creation", () => {
        it("should correctly seed playoff pairings (e.g. 9 vs 24)", () => {
            // Rank 9 to 24 means 16 teams. Let's use 4 teams for simplicity
            const teams = ["Rank 9", "Rank 10", "Rank 11", "Rank 12"];
            const pairings = createPlayoffPairings(teams);

            expect(pairings).toHaveLength(2);
            // Lower seed is home in Leg 1 (array end -> array start)
            expect(pairings[0].homeTeam).toBe("Rank 12");
            expect(pairings[0].awayTeam).toBe("Rank 9");

            expect(pairings[1].homeTeam).toBe("Rank 11");
            expect(pairings[1].awayTeam).toBe("Rank 10");
        });

        it("should correctly create R16 pairings", () => {
            const top8 = ["Seed 1", "Seed 2"];
            const winners = ["Winner 1", "Winner 2"];

            const pairings = createR16Pairings(top8, winners);
            expect(pairings).toHaveLength(2);

            // Playoff winners are home Leg 1, against highest seeds
            expect(pairings[0].homeTeam).toBe("Winner 2");
            expect(pairings[0].awayTeam).toBe("Seed 1");

            expect(pairings[1].homeTeam).toBe("Winner 1");
            expect(pairings[1].awayTeam).toBe("Seed 2");
        });
    });
});
