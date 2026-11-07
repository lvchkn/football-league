import type { H2HRecord, Table, TableRow } from "../interfaces/table.js";

/*
 * League-phase ranking. Tracking (points, goals, head-to-head) is shared:
 * see utils/table.ts.
 */

/**
 * Head-to-head tiebreaker for the Swiss-format league phase.
 * Returns negative if teamA is better (should appear first in descending sort),
 * positive if teamB is better, 0 if equal.
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
 */
export function sortLeagueStageTable(table: Table): TableRow[] {
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
