import type { LeaguePhase } from "../interfaces/round.js";
import type { Teams } from "../interfaces/tournament.js";
import type { DomesticStorage } from "./storage.js";
import { generateFixtures } from "./fixtures.js";

/**
 * A league's fixtures with saved results filled in. When nothing is saved
 * (or the save belongs to an older roster), fresh fixtures are generated
 * and their structure saved.
 */
export function loadLeagueFixtures(
    storage: DomesticStorage,
    league: string,
    teams: Teams,
    rosterVersion: string | null,
): LeaguePhase {
    const structure = storage.getFixturesStructure(league, rosterVersion);
    let fixtures: LeaguePhase;

    if (structure) {
        fixtures = structure.map(function (round: any[]) {
            return {
                matches: round.map(function (match: any) {
                    return {
                        homeTeam: match.homeTeam || match.home,
                        awayTeam: match.awayTeam || match.away,
                        homeGoals: null,
                        awayGoals: null,
                    };
                }),
            };
        });
    } else {
        fixtures = generateFixtures(teams);
        storage.setFixturesStructure(fixtures, league, rosterVersion);
    }

    try {
        const saved = storage.getFixtures(league, rosterVersion);
        if (Array.isArray(saved)) {
            saved.slice(0, fixtures.length).forEach(function (round: unknown, r: number) {
                if (!Array.isArray(round)) return;
                round.slice(0, fixtures[r]!.matches.length).forEach(function (result: any, m: number) {
                    if (
                        result &&
                        typeof result.homeGoals !== "undefined" &&
                        typeof result.awayGoals !== "undefined"
                    ) {
                        fixtures[r]!.matches[m]!.homeGoals = result.homeGoals;
                        fixtures[r]!.matches[m]!.awayGoals = result.awayGoals;
                    }
                });
            });
        }
    } catch (e) {
        console.warn("Failed to load saved results", e);
    }

    return fixtures;
}
