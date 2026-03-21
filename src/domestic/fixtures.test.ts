import { describe, it, expect } from "vitest";
import { generateFixtures } from "./fixtures.js";

describe("Fixture Generation", () => {
    it("should throw an error for an odd number of teams", () => {
        expect(() => generateFixtures(["A", "B", "C"])).toThrow(
            "Number of teams must be even",
        );
    });

    it("should generate the correct number of rounds and matches for 4 teams", () => {
        const teams = ["Team A", "Team B", "Team C", "Team D"];
        const numTeams = teams.length;
        const totalRounds = (numTeams - 1) * 2;
        const matchesPerRound = numTeams / 2;

        const leaguePhase = generateFixtures(teams);

        expect(leaguePhase).toHaveLength(totalRounds);

        leaguePhase.forEach((round) => {
            expect(round.matches).toHaveLength(matchesPerRound);
        });
    });

    it("every team should play every other team exactly twice (home and away)", () => {
        const teams = ["A", "B", "C", "D"];
        const leaguePhase = generateFixtures(teams);

        const matchupCounts: Record<string, number> = {};

        leaguePhase.forEach((round) => {
            round.matches.forEach((match) => {
                const key = `${match.homeTeam}-${match.awayTeam}`;
                matchupCounts[key] = (matchupCounts[key] || 0) + 1;
            });
        });

        teams.forEach((home) => {
            teams.forEach((away) => {
                if (home !== away) {
                    const key = `${home}-${away}`;
                    expect(matchupCounts[key]).toBe(1);
                }
            });
        });
    });
});
