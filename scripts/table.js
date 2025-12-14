/**
 * League table state
 */
let table = {};

/**
 * Initialize empty league table
 * @param {string[]} teams - array of team names
 * @return {void}
 */
function initTable(teams) {
    table = {};
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
}

/**
 * Apply match result to the league table
 * @param {Object} match - match object with home, away, hg, ag
 * @return {void}
 */
function applyMatchResult(match) {
    const { home, away, hg, ag } = match;

    if (hg === null || ag === null) return; // ignore incomplete

    const homeRow = table[home];
    const awayRow = table[away];

    homeRow.played++;
    awayRow.played++;

    homeRow.gf += hg;
    homeRow.ga += ag;

    awayRow.gf += ag;
    awayRow.ga += hg;

    if (hg > ag) {
        homeRow.points += 3;
        homeRow.wins++;
        awayRow.losses++;
    } else if (hg < ag) {
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
 * @return {Array} - sorted array of team standings
 */
function getSortedTable() {
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
