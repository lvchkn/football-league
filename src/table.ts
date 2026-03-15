import type { Match } from "./uefa/fixtures.js";
import type { Table, TableRow } from "./uefa/table.js";
import type { Teams } from "./uefa/teams.js";

/**
 * Initialize empty league table
 * @param {string[]} teams - array of team names
 * @return {Table} table
 */
export function initTable(teams: Teams): Table {
    const table: Table = {};

    teams.forEach((t: string) => {
        table[t] = {
            team: t,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0,
            h2h: {},
        };
    });

    return table;
}

/**
 * Apply match result to the league table
 * @param {Match} match - match object with home, away, homeGoals, awayGoals
 * @param {Table} table - league table
 * @return {void}
 */
export function applyMatchResult(match: Match, table: Table): void {
    const { homeTeam, awayTeam, homeGoals, awayGoals } = match;

    if (homeGoals === null || awayGoals === null) {
        return;
    }

    const homeRow = table[homeTeam];
    const awayRow = table[awayTeam];

    homeRow.played++;
    awayRow.played++;

    homeRow.gf += homeGoals;
    homeRow.ga += awayGoals;

    awayRow.gf += awayGoals;
    awayRow.ga += homeGoals;

    if (homeGoals > awayGoals) {
        homeRow.points += 3;
        homeRow.wins++;
        awayRow.losses++;
    } else if (homeGoals < awayGoals) {
        awayRow.points += 3;
        awayRow.wins++;
        homeRow.losses++;
    } else {
        homeRow.points += 1;
        awayRow.points += 1;
        homeRow.draws++;
        awayRow.draws++;
    }
}

/**
 * Get sorted table standings
 * @param {Table} table - league table
 * @return {TableRow[]} - sorted array of team standings
 */
export function sortTable(table: Table): TableRow[] {
    return Object.values(table).sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }

        const gdA = a.gf - a.ga;
        const gdB = b.gf - b.ga;

        if (gdB !== gdA) {
            return gdB - gdA;
        }

        return b.gf - a.gf;
    });
}
