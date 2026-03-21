import type { LeagueMatch, MatchUpdate } from "../interfaces/match.js";
import type { LeaguePhase, LeagueRound } from "../interfaces/round.js";
import type { Table } from "../interfaces/table.js";
import type {
    Teams,
    LeagueList,
    CompetitionApp,
} from "../interfaces/tournament.js";

import * as storage from "./storage.js";
import { applyMatchResult, initTable, removeMatchResult } from "./table.js";
import { getTeamsByLeague } from "./teams.js";
import { renderFixtures, renderTable } from "./ui.js";
import { generateFixtures } from "./fixtures.js";
import { shuffleArray } from "../utils/shuffle.js";

/**
 * Create a domestic league app for the given league.
 */
export function createDomesticApp(selectedLeague: LeagueList): CompetitionApp {
    let fixtures: LeaguePhase = [];
    let table: Table = {};
    let teams: Teams = [];
    const league: LeagueList = selectedLeague;

    /**
     * Recalculate the domestic league table from fixtures.
     */
    function recalcTable(): void {
        table = initTable(teams);
        fixtures.forEach((round: LeagueRound) =>
            round.matches.forEach(function (match: LeagueMatch) {
                applyMatchResult(match, table);
            }),
        );
        renderTable(table);
    }

    /**
     * Update the standings table incrementally.
     */
    function updateTableIncrementally(updates: MatchUpdate[]): void {
        updates.forEach((update) => {
            removeMatchResult(update.oldMatch, table);
            applyMatchResult(update.match, table);
        });
        renderTable(table);
    }

    /**
     * Load fixtures from storage or generate fresh ones.
     */
    function initializeFixtures(): void {
        const structure = storage.getFixturesStructure(league);

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
            storage.setFixturesStructure(fixtures, league);
        }

        // Merge saved results
        try {
            const savedFixtures = storage.getFixtures(league);

            if (savedFixtures && Array.isArray(savedFixtures)) {
                for (
                    let r = 0;
                    r < Math.min(savedFixtures.length, fixtures.length);
                    r++
                ) {
                    const round = savedFixtures[r];
                    if (!Array.isArray(round)) continue;
                    for (
                        let match = 0;
                        match <
                        Math.min(round.length, fixtures[r].matches.length);
                        match++
                    ) {
                        const result = round[match];
                        if (
                            result &&
                            typeof result.homeGoals !== "undefined" &&
                            typeof result.awayGoals !== "undefined"
                        ) {
                            fixtures[r].matches[match].homeGoals =
                                result.homeGoals;
                            fixtures[r].matches[match].awayGoals =
                                result.awayGoals;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to load saved results", e);
        }
    }

    /**
     * Render all fixtures for the current domestic league.
     */
    function renderAllFixtures(): void {
        const onResultsApplied = function (updates: MatchUpdate[]) {
            updateTableIncrementally(updates);
            storage.setFixturesDebounced(fixtures, league);
        };

        renderFixtures(fixtures, onResultsApplied);
    }

    function init(): void {
        teams = getTeamsByLeague(league);
        initializeFixtures();
        recalcTable();
        renderAllFixtures();
    }

    function regenerate(): void {
        storage.clearAll(league);
        fixtures = generateFixtures(shuffleArray(teams));
        storage.setFixturesStructure(fixtures, league);
        recalcTable();
        renderAllFixtures();
    }

    function save(): void {
        storage.setFixturesImmediate(fixtures, league);
    }

    function reset(): void {
        fixtures = fixtures.map(function (round: LeagueRound) {
            return {
                matches: round.matches.map(function (match: LeagueMatch) {
                    return {
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam,
                        homeGoals: null,
                        awayGoals: null,
                    };
                }),
            };
        });

        recalcTable();
        renderAllFixtures();
        storage.setFixturesImmediate(fixtures, league);
    }

    function destroy(): void {
        storage.cancelPendingSave(league);
        table = {};
        fixtures = [];
        teams = [];
    }

    return { init, save, reset, regenerate, destroy };
}
