import type { Match } from "../interfaces/match.js";
import type { H2HRecord, Table, TableRow } from "../interfaces/table.js";
import type { Teams } from "../interfaces/tournament.js";

/**
 * Initialize empty league table
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

function _emptyH2HRecord(): H2HRecord {
    return {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
    };
}

function _updateH2HRecord(
    row: TableRow,
    opponent: string,
    goalsFor: number,
    goalsAgainst: number,
    direction: 1 | -1,
): void {
    const record = row.h2h[opponent] || _emptyH2HRecord();

    record.played += direction;
    record.gf += direction * goalsFor;
    record.ga += direction * goalsAgainst;

    if (goalsFor > goalsAgainst) {
        record.wins += direction;
    } else if (goalsFor < goalsAgainst) {
        record.losses += direction;
    } else {
        record.draws += direction;
    }

    if (record.played === 0) {
        delete row.h2h[opponent];
        return;
    }

    row.h2h[opponent] = record;
}

function _updateHeadToHead(
    match: Match,
    table: Table,
    direction: 1 | -1,
): void {
    const { homeTeam, awayTeam, homeGoals, awayGoals } = match;
    if (homeGoals === null || awayGoals === null) return;

    const homeRow = table[homeTeam];
    const awayRow = table[awayTeam];
    if (!homeRow || !awayRow) return;

    _updateH2HRecord(
        homeRow,
        awayTeam,
        homeGoals,
        awayGoals,
        direction,
    );
    _updateH2HRecord(
        awayRow,
        homeTeam,
        awayGoals,
        homeGoals,
        direction,
    );
}

/**
 * Apply match result to the league table
 */
export function applyMatchResult(match: Match, table: Table): void {
    const { homeTeam, awayTeam, homeGoals, awayGoals } = match;

    if (homeGoals === null || awayGoals === null) {
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

    _updateHeadToHead(match, table, 1);
}

/**
 * Remove match result from the league table (undo applyMatchResult)
 */
export function removeMatchResult(match: Match, table: Table): void {
    const { homeTeam, awayTeam, homeGoals, awayGoals } = match;

    if (homeGoals === null || awayGoals === null) {
        return;
    }

    const homeRow = table[homeTeam];
    const awayRow = table[awayTeam];

    if (!homeRow || !awayRow) return;

    homeRow.played--;
    awayRow.played--;

    homeRow.gf -= homeGoals;
    homeRow.ga -= awayGoals;

    awayRow.gf -= awayGoals;
    awayRow.ga -= homeGoals;

    if (homeGoals > awayGoals) {
        homeRow.points -= 3;
        homeRow.wins--;
        awayRow.losses--;
    } else if (homeGoals < awayGoals) {
        awayRow.points -= 3;
        awayRow.wins--;
        homeRow.losses--;
    } else {
        homeRow.points -= 1;
        awayRow.points -= 1;
        homeRow.draws--;
        awayRow.draws--;
    }

    _updateHeadToHead(match, table, -1);
}

interface MiniTableRow {
    points: number;
    gf: number;
    ga: number;
}

function _getMiniTable(rows: TableRow[]): Map<string, MiniTableRow> {
    const miniTable = new Map<string, MiniTableRow>();
    const tiedTeams = new Set(rows.map((row) => row.team));

    rows.forEach(function (row) {
        const miniRow: MiniTableRow = { points: 0, gf: 0, ga: 0 };

        Object.entries(row.h2h).forEach(function ([opponent, record]) {
            if (!tiedTeams.has(opponent)) return;

            miniRow.points += record.wins * 3 + record.draws;
            miniRow.gf += record.gf;
            miniRow.ga += record.ga;
        });

        miniTable.set(row.team, miniRow);
    });

    return miniTable;
}

function _compareOverall(a: TableRow, b: TableRow): number {
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;

    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
}

/**
 * Get sorted table standings
 */
export function sortTable(table: Table): TableRow[] {
    const pointGroups = new Map<number, TableRow[]>();

    Object.values(table).forEach(function (row) {
        const group = pointGroups.get(row.points) || [];
        group.push(row);
        pointGroups.set(row.points, group);
    });

    return [...pointGroups.entries()]
        .sort(([pointsA], [pointsB]) => pointsB - pointsA)
        .flatMap(function ([, rows]) {
            const miniTable = _getMiniTable(rows);

            return rows.sort(function (a, b) {
                const miniA = miniTable.get(a.team)!;
                const miniB = miniTable.get(b.team)!;

                if (miniB.points !== miniA.points) {
                    return miniB.points - miniA.points;
                }

                const miniGdA = miniA.gf - miniA.ga;
                const miniGdB = miniB.gf - miniB.ga;
                if (miniGdB !== miniGdA) return miniGdB - miniGdA;

                if (miniB.gf !== miniA.gf) return miniB.gf - miniA.gf;

                return _compareOverall(a, b);
            });
        });
}
