import type { LeagueMatch, LeaguePhase, LeagueRound } from "./uefa/fixtures.js";
import type { Table } from "./uefa/table.js";
import type { Teams } from "./uefa/teams.js";

import { applyMatchResult, initTable } from "./table.js";
import { getTeamsByLeague, type LeagueList } from "./teams.js";
import { renderFixtures, renderTable } from "./ui.js";
import { _shuffleArray, generateFixtures } from "./fixtures.js";
import * as storage from "./storage.js";

let fixtures: LeaguePhase = [];
let table: Table = {};
let teams: Teams = [];
let league: LeagueList = "english";

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
                    match < Math.min(round.length, fixtures[r].matches.length);
                    match++
                ) {
                    const result = round[match];
                    if (
                        result &&
                        typeof result.homeGoals !== "undefined" &&
                        typeof result.awayGoals !== "undefined"
                    ) {
                        fixtures[r].matches[match].homeGoals = result.homeGoals;
                        fixtures[r].matches[match].awayGoals = result.awayGoals;
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
    const onResultApplied = function () {
        recalcTable();
        storage.setFixturesDebounced(fixtures, league);
    };

    renderFixtures(fixtures, onResultApplied);
}

/**
 * Initialize a domestic league: load teams, fixtures, render.
 */
export function init(selectedLeague: LeagueList): void {
    league = selectedLeague;
    teams = getTeamsByLeague(league);
    initializeFixtures();
    recalcTable();
    renderAllFixtures();
}

/**
 * Regenerate fixtures and clear all progress.
 */
export function regenerate(): void {
    storage.clearAll(league);
    fixtures = generateFixtures(_shuffleArray(teams));
    storage.setFixturesStructure(fixtures, league);
    recalcTable();
    renderAllFixtures();
}

/**
 * Persist current fixtures immediately.
 */
export function save(): void {
    storage.setFixturesImmediate(fixtures, league);
}

/**
 * Reset all scores to null and re-render.
 */
export function reset(): void {
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
