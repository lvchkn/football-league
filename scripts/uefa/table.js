window.FootballLeague = window.FootballLeague || {};
window.FootballLeague.UEFA = window.FootballLeague.UEFA || {};

/**
 * Initialize empty UEFA table for the league phase.
 * @param {string[]} teams - array of team names
 * @return {Object} table keyed by team name
 */
function initUEFATable(teams) {
    var table = {};
    teams.forEach(function (t) {
        table[t] = {
            team: t,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
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
 * @param {Object} match - { home, away, homeGoals, awayGoals }
 * @param {Object} table - league table
 * @return {void}
 */
function applyUEFAMatchResult(match, table) {
    var home = match.home;
    var away = match.away;
    var homeGoals = match.homeGoals;
    var awayGoals = match.awayGoals;

    if (homeGoals === null || awayGoals === null) return;

    var homeRow = table[home];
    var awayRow = table[away];
    if (!homeRow || !awayRow) return;

    homeRow.played++;
    awayRow.played++;

    homeRow.gf += homeGoals;
    homeRow.ga += awayGoals;
    awayRow.gf += awayGoals;
    awayRow.ga += homeGoals;

    // Head-to-head tracking
    if (!homeRow.h2h[away])
        homeRow.h2h[away] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
        };
    if (!awayRow.h2h[home])
        awayRow.h2h[home] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
        };

    homeRow.h2h[away].played++;
    awayRow.h2h[home].played++;
    homeRow.h2h[away].gf += homeGoals;
    homeRow.h2h[away].ga += awayGoals;
    awayRow.h2h[home].gf += awayGoals;
    awayRow.h2h[home].ga += homeGoals;

    if (homeGoals > awayGoals) {
        homeRow.points += 3;
        homeRow.wins++;
        awayRow.losses++;
        homeRow.h2h[away].wins++;
        awayRow.h2h[home].losses++;
    } else if (homeGoals < awayGoals) {
        awayRow.points += 3;
        awayRow.wins++;
        homeRow.losses++;
        awayRow.h2h[home].wins++;
        homeRow.h2h[away].losses++;
    } else {
        homeRow.points += 1;
        awayRow.points += 1;
        homeRow.draws++;
        awayRow.draws++;
        homeRow.h2h[away].draws++;
        awayRow.h2h[home].draws++;
    }
}

/**
 * Head-to-head tiebreaker for the Swiss-format league phase.
 * Returns negative if teamA is better (should appear first in descending sort),
 * positive if teamB is better, 0 if equal.
 * @param {Object} teamA
 * @param {Object} teamB
 * @return {number}
 */
function getSwissH2HTiebreak(teamA, teamB) {
    var h2hA = teamA.h2h[teamB.team];
    var h2hB = teamB.h2h[teamA.team];

    if (!h2hA || !h2hB) return 0;

    // Head-to-head points
    var h2hPointsA = h2hA.wins * 3 + h2hA.draws;
    var h2hPointsB = h2hB.wins * 3 + h2hB.draws;
    if (h2hPointsA !== h2hPointsB) {
        return h2hPointsA > h2hPointsB ? -1 : 1;
    }

    // Head-to-head goal difference
    var h2hGDA = h2hA.gf - h2hA.ga;
    var h2hGDB = h2hB.gf - h2hB.ga;
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
 * @param {Object} table
 * @return {Array<Object>}
 */
function sortUEFATable(table) {
    return Object.values(table).sort(function (a, b) {
        // Points (descending)
        if (b.points !== a.points) return b.points - a.points;

        // Head-to-head (Swiss format)
        var h2h = getSwissH2HTiebreak(a, b);
        if (h2h !== 0) return h2h;

        // Overall goal difference
        var gdA = a.gf - a.ga;
        var gdB = b.gf - b.ga;
        if (gdA !== gdB) return gdB - gdA;

        // Goals scored
        if (a.gf !== b.gf) return b.gf - a.gf;

        // Alphabetical
        return a.team.localeCompare(b.team);
    });
}

/**
 * Get teams qualifying for the next phase from the league table.
 * @param {Object} table
 * @param {number} numTeams - how many to take from the top
 * @return {string[]}
 */
function getQualifiedTeams(table, numTeams) {
    var sorted = sortUEFATable(table);
    return sorted.slice(0, numTeams).map(function (t) {
        return t.team;
    });
}

Object.assign(window.FootballLeague.UEFA, {
    initTable: initUEFATable,
    applyMatchResult: applyUEFAMatchResult,
    sortTable: sortUEFATable,
    getQualifiedTeams: getQualifiedTeams,
});
