window.FootballLeague = window.FootballLeague || {};

/**
 * Initialize empty league table
 * @param {string[]} teams - array of team names
 * @return {Object} table
 */
function initTable(teams) {
    const table = {};

    teams.forEach((t) => {
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
        };
    });

    return table;
}

/**
 * Apply match result to the league table
 * @param {Object} match - match object with home, away, homeGoals, awayGoals
 * @param {Object} table - league table
 * @return {void}
 */
function applyMatchResult(match, table) {
    const { home, away, homeGoals, awayGoals } = match;

    if (homeGoals === null || awayGoals === null) return; // ignore incomplete

    const homeRow = table[home];
    const awayRow = table[away];

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
 * @param {Object} table - league table
 * @return {Array} - sorted array of team standings
 */
function sortTable(table) {
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

Object.assign(window.FootballLeague, {
    initTable,
    applyMatchResult,
    sortTable,
});
