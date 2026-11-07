import type { LeagueMatch, MatchUpdate } from "../interfaces/match.js";
import type { LeaguePhase, LeagueRound } from "../interfaces/round.js";
import type { Table, TableZone } from "../interfaces/table.js";
import type {
    Teams,
    LeagueList,
    CompetitionApp,
} from "../interfaces/tournament.js";

import type { DomesticStorage } from "./storage.js";
import { applyMatchResult, initTable, removeMatchResult } from "../utils/table.js";
import { renderFixtures, renderTable, renderZoneLegend } from "./ui.js";
import { generateFixtures } from "./fixtures.js";
import { loadLeagueFixtures } from "./load.js";
import { shuffleArray } from "../utils/shuffle.js";
import { simulateLeagueRounds, type RatingOf } from "../utils/simulation.js";
import { collectTypedResults, syncScoreInputs } from "../simulation-controls.js";

/**
 * What a domestic league app runs on: its teams, where it saves, and how
 * strong each team is in simulations. Differs between Classic and Career.
 */
export interface DomesticContext {
    id: LeagueList;
    teams: Teams;
    rosterVersion: string | null;
    storage: DomesticStorage;
    ratingOf: RatingOf;
    /** Highlighted table positions (Career mode). */
    zones: TableZone[];
}

/**
 * Create a domestic league app for the given league.
 */
export function createDomesticApp(ctx: DomesticContext): CompetitionApp {
    let fixtures: LeaguePhase = [];
    let table: Table = {};
    let teams: Teams = [];
    const league: LeagueList = ctx.id;
    const storage = ctx.storage;

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
        renderTable(table, fixtures, ctx.zones);
    }

    /**
     * Update the standings table incrementally.
     */
    function updateTableIncrementally(updates: MatchUpdate[]): void {
        updates.forEach((update) => {
            removeMatchResult(update.oldMatch, table);
            applyMatchResult(update.match, table);
        });
        renderTable(table, fixtures, ctx.zones);
    }

    /**
     * Load fixtures from storage or generate fresh ones.
     */
    function initializeFixtures(): void {
        fixtures = loadLeagueFixtures(storage, league, teams, ctx.rosterVersion);
    }

    /**
     * Render all fixtures for the current domestic league.
     */
    function renderAllFixtures(): void {
        const onResultsApplied = function (updates: MatchUpdate[]) {
            updateTableIncrementally(updates);
            storage.setFixturesDebounced(
                fixtures,
                league,
                ctx.rosterVersion,
            );
        };

        renderFixtures(fixtures, onResultsApplied, simulate);
    }

    /**
     * Fill unplayed matches in the given rounds with simulated scores.
     */
    function simulate(roundIndices: number[]): void {
        const updates = [
            ...collectTypedResults(fixtures, roundIndices),
            ...simulateLeagueRounds(fixtures, roundIndices, ctx.ratingOf),
        ];
        if (updates.length === 0) return;

        syncScoreInputs(fixtures, roundIndices);
        updateTableIncrementally(updates);
        storage.setFixturesDebounced(
            fixtures,
            league,
            ctx.rosterVersion,
        );
    }

    function init(): void {
        teams = ctx.teams;
        initializeFixtures();
        recalcTable();
        renderAllFixtures();
    }

    function regenerate(): void {
        storage.clearAll(league);
        fixtures = generateFixtures(shuffleArray(teams));
        storage.setFixturesStructure(
            fixtures,
            league,
            ctx.rosterVersion,
        );
        recalcTable();
        renderAllFixtures();
    }

    function save(): void {
        storage.setFixturesImmediate(
            fixtures,
            league,
            ctx.rosterVersion,
        );
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
        storage.setFixturesImmediate(
            fixtures,
            league,
            ctx.rosterVersion,
        );
    }

    function destroy(): void {
        renderZoneLegend([]);
        storage.cancelPendingSave(league);
        table = {};
        fixtures = [];
        teams = [];
    }

    return { init, save, reset, regenerate, destroy };
}
