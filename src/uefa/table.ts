import type { Match } from "./fixtures.js";
import type { Teams } from "./teams.js";

export interface Table {
    [key: string]: TableRow;
}

export interface TableRow {
    team: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    gd: number;
    ga: number;
    points: number;
    h2h: HeadToHead;
}

export interface HeadToHead {
    [key: string]: H2HRecord;
}

export interface H2HRecord {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    ga: number;
}

/**
 * Initialize empty UEFA table for the league phase.
 * @param {string[]} teams - array of team names
 * @return {Table} table keyed by team name
 */
export function initUEFATable(teams: Teams): Table {
    const table: Table = {};

    teams.forEach(function (t: string) {
        table[t] = {
            team: t,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            gd: 0,
            ga: 0,
            points: 0,
            h2h: {},
        };
    });

    return table;
}

/**
 * Apply a single match result to the UEFA league table.
 * Skips matches that have not been played yet (null goals).
 * @param {Match} match
 * @param {Table} table
 * @return {void}
 */
export function applyUEFAMatchResult(match: Match, table: Table): void {
    const { homeTeam, awayTeam, homeGoals, awayGoals } = match;

    if (homeGoals == null || awayGoals == null) {
        return;
    }

    const homeRow = table[homeTeam];
    const awayRow = table[awayTeam];

    if (!homeRow || !awayRow) return;

    homeRow.played++;
    awayRow.played++;

    homeRow.gf += homeGoals;
    homeRow.ga += awayGoals;

    awayRow.gf += awayGoals;
    awayRow.ga += homeGoals;

    if (!homeRow.h2h[awayTeam])
        homeRow.h2h[awayTeam] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
        };

    if (!awayRow.h2h[homeTeam])
        awayRow.h2h[homeTeam] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
        };

    homeRow.h2h[awayTeam].played++;
    awayRow.h2h[homeTeam].played++;

    homeRow.h2h[awayTeam].gf += homeGoals;
    homeRow.h2h[awayTeam].ga += awayGoals;

    awayRow.h2h[homeTeam].gf += awayGoals;
    awayRow.h2h[homeTeam].ga += homeGoals;

    if (homeGoals > awayGoals) {
        homeRow.points += 3;
        homeRow.wins++;
        awayRow.losses++;
        homeRow.h2h[awayTeam].wins++;
        awayRow.h2h[homeTeam].losses++;
    } else if (homeGoals < awayGoals) {
        awayRow.points += 3;
        awayRow.wins++;
        homeRow.losses++;
        awayRow.h2h[homeTeam].wins++;
        homeRow.h2h[awayTeam].losses++;
    } else {
        homeRow.points += 1;
        awayRow.points += 1;
        homeRow.draws++;
        awayRow.draws++;
        homeRow.h2h[awayTeam].draws++;
        awayRow.h2h[homeTeam].draws++;
    }
}

/**
 * Head-to-head tiebreaker for the Swiss-format league phase.
 * Returns negative if teamA is better (should appear first in descending sort),
 * positive if teamB is better, 0 if equal.
 * @param {TableRow} tableRowA
 * @param {TableRow} tableRowB
 * @return {number}
 */
function getSwissH2HTiebreak(tableRowA: TableRow, tableRowB: TableRow): number {
    const h2hA: H2HRecord = tableRowA.h2h[tableRowB.team];
    const h2hB: H2HRecord = tableRowB.h2h[tableRowA.team];

    if (!h2hA || !h2hB) return 0;

    // Head-to-head points
    const h2hPointsA: number = h2hA.wins * 3 + h2hA.draws;
    const h2hPointsB: number = h2hB.wins * 3 + h2hB.draws;

    if (h2hPointsA !== h2hPointsB) {
        return h2hPointsA > h2hPointsB ? -1 : 1;
    }

    // Head-to-head goal difference
    const h2hGDA: number = h2hA.gf - h2hA.ga;
    const h2hGDB: number = h2hB.gf - h2hB.ga;

    if (h2hGDA !== h2hGDB) {
        return h2hGDA > h2hGDB ? -1 : 1;
    }

    // Head-to-head goals scored
    if (h2hA.gf !== h2hB.gf) {
        return h2hA.gf > h2hB.gf ? -1 : 1;
    }

    return 0;
}

/**
 * Sort the league table in descending order (best team first).
 * Tiebreaker order: points -> H2H -> goal difference -> goals for -> alphabetical.
 * @param {Table} table
 * @return {TableRow[]}
 */
export function sortUEFATable(table: Table): TableRow[] {
    return Object.values(table).sort(function (a, b) {
        // Points (descending)
        if (b.points !== a.points) {
            return b.points - a.points;
        }

        // Head-to-head (Swiss format)
        const h2h = getSwissH2HTiebreak(a, b);
        if (h2h !== 0) {
            return h2h;
        }

        // Overall goal difference
        const gdA = a.gf - a.ga;
        const gdB = b.gf - b.ga;
        if (gdA !== gdB) {
            return gdB - gdA;
        }

        // Goals scored
        if (a.gf !== b.gf) {
            return b.gf - a.gf;
        }

        // Alphabetical
        return a.team.localeCompare(b.team);
    });
}

/**
 * Get teams qualifying for the next phase from the league table.
 * @param {Table} table
 * @param {number} numTeams - how many to take from the top
 * @return {string[]}
 */
export function getQualifiedTeams(table: Table, numTeams: number): Teams {
    const sortedRows: TableRow[] = sortUEFATable(table);

    const qualifiedTeams: string[] = sortedRows
        .slice(0, numTeams)
        .map(function (row: TableRow) {
            return row.team;
        });

    return qualifiedTeams;
}
