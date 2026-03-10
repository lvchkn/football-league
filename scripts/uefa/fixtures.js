window.FootballLeague = window.FootballLeague || {};
window.FootballLeague.UEFA = window.FootballLeague.UEFA || {};

/**
 * Generate league phase fixtures (8 rounds, 36 teams, each team plays exactly 8 matches).
 * Uses the circle method from round-robin scheduling, taking the first 8 of 35 possible rounds.
 * Each round has 18 matches (all 36 teams play once per round).
 * @param {string[]} teamNames - array of 36 team names
 * @returns {Array<Array<Object>>} - 8 rounds, each with 18 matches
 */
function generateLeaguePhaseFixtures(teamNames) {
    const n = teamNames.length;
    const numRounds = 8;

    // Circle method: fix team[0], rotate indices [1..n-1]
    const rotating = [];
    for (let i = 1; i < n; i++) rotating.push(i);

    const rounds = [];

    for (let round = 0; round < numRounds; round++) {
        const matches = [];

        // Fixed team vs last in rotation
        const opponentIdx = rotating[rotating.length - 1];
        if (round % 2 === 0) {
            matches.push({
                home: teamNames[0],
                away: teamNames[opponentIdx],
                homeGoals: null,
                awayGoals: null,
            });
        } else {
            matches.push({
                home: teamNames[opponentIdx],
                away: teamNames[0],
                homeGoals: null,
                awayGoals: null,
            });
        }

        // Pair remaining from ends of the rotation array
        const halfLen = (n - 2) / 2; // 17 for 36 teams
        for (let i = 0; i < halfLen; i++) {
            const a = rotating[i];
            const b = rotating[rotating.length - 2 - i];
            if ((round + i) % 2 === 0) {
                matches.push({
                    home: teamNames[a],
                    away: teamNames[b],
                    homeGoals: null,
                    awayGoals: null,
                });
            } else {
                matches.push({
                    home: teamNames[b],
                    away: teamNames[a],
                    homeGoals: null,
                    awayGoals: null,
                });
            }
        }

        rounds.push(matches);

        // Rotate right: move last element to front
        rotating.unshift(rotating.pop());
    }

    return rounds;
}

/**
 * Generate two-leg knockout fixtures from an array of seed pairings.
 * In each pairing the first team is home in Leg 1, second team is home in Leg 2.
 * @param {Array<[string, string]>} pairings - [[homeL1, awayL1], ...]
 * @returns {Array<Array<Object>>} - single round containing all leg matches (paired consecutively)
 */
function generateTwoLegFixtures(pairings) {
    const matches = [];
    pairings.forEach(function (pair, i) {
        matches.push({
            home: pair[0],
            away: pair[1],
            homeGoals: null,
            awayGoals: null,
            leg: 1,
            tieIndex: i,
        });
        matches.push({
            home: pair[1],
            away: pair[0],
            homeGoals: null,
            awayGoals: null,
            leg: 2,
            tieIndex: i,
        });
    });
    return [matches];
}

/**
 * Generate a single-match final fixture.
 * @param {string} teamA
 * @param {string} teamB
 * @returns {Array<Array<Object>>}
 */
function generateFinalFixture(teamA, teamB) {
    return [
        [
            {
                home: teamA,
                away: teamB,
                homeGoals: null,
                awayGoals: null,
            },
        ],
    ];
}

/**
 * Determine the winner of a completed two-leg tie.
 * If the aggregate is level, the higher-seeded team (Leg 1 home) advances
 * (in real life this would go to extra time and penalties in Leg 2).
 * @param {Object} leg1 - leg 1 match object
 * @param {Object} leg2 - leg 2 match object
 * @returns {string|null} - winning team name, or null if either leg is incomplete
 */
function getTieWinner(leg1, leg2) {
    if (
        leg1.homeGoals === null ||
        leg1.awayGoals === null ||
        leg2.homeGoals === null ||
        leg2.awayGoals === null
    ) {
        return null;
    }

    var team1 = leg1.home;
    var team2 = leg1.away;
    var agg1 = leg1.homeGoals + leg2.awayGoals; // team1's aggregate
    var agg2 = leg1.awayGoals + leg2.homeGoals; // team2's aggregate

    if (agg1 > agg2) return team1;
    if (agg2 > agg1) return team2;

    // Tied on aggregate — higher seed (leg 1 home) advances
    return team1;
}

/**
 * Extract every tie winner from a set of two-leg knockout fixtures.
 * Matches in the flat list are expected to alternate: leg1, leg2, leg1, leg2, ...
 * @param {Array<Array<Object>>} fixtures
 * @returns {string[]} - array of winning team names (empty entries if ties are incomplete)
 */
function getKnockoutWinners(fixtures) {
    var matches = fixtures.flat();
    var winners = [];
    for (var i = 0; i < matches.length; i += 2) {
        var winner = getTieWinner(matches[i], matches[i + 1]);
        if (winner) winners.push(winner);
    }
    return winners;
}

/**
 * Create playoff pairings from teams ranked 9-24 in the league phase.
 * Seeding: 9 vs 24, 10 vs 23, 11 vs 22, ... , 16 vs 17.
 * Lower-seeded team is home in Leg 1; higher seed gets home advantage in Leg 2.
 * @param {string[]} playoffTeams - 16 team names ordered by league rank (index 0 = rank 9)
 * @returns {Array<[string, string]>}
 */
function createPlayoffPairings(playoffTeams) {
    var pairings = [];
    var half = playoffTeams.length / 2;
    for (var i = 0; i < half; i++) {
        // Lower seed (e.g. 24th) is home in Leg 1, higher seed (e.g. 9th) in Leg 2
        pairings.push([
            playoffTeams[playoffTeams.length - 1 - i],
            playoffTeams[i],
        ]);
    }
    return pairings;
}

/**
 * Create Round-of-16 pairings.
 * Top 8 (direct qualifiers) vs 8 playoff winners.
 * 1st vs playoff-winner-8, 2nd vs playoff-winner-7, ...
 * Playoff winners are home Leg 1; top-8 teams home Leg 2.
 * @param {string[]} top8 - teams ranked 1-8 from the league phase
 * @param {string[]} playoffWinners - 8 winners from the playoff round
 * @returns {Array<[string, string]>}
 */
function createR16Pairings(top8, playoffWinners) {
    var pairings = [];
    for (var i = 0; i < top8.length; i++) {
        pairings.push([playoffWinners[playoffWinners.length - 1 - i], top8[i]]);
    }
    return pairings;
}

/**
 * Create generic knockout pairings from a list of qualified teams.
 * 1st vs last, 2nd vs second-to-last, etc.
 * @param {string[]} teams
 * @returns {Array<[string, string]>}
 */
function createKnockoutPairings(teams) {
    var pairings = [];
    var half = teams.length / 2;
    for (var i = 0; i < half; i++) {
        pairings.push([teams[teams.length - 1 - i], teams[i]]);
    }
    return pairings;
}

/**
 * Top-level fixture generator for any UEFA phase.
 * @param {string[]} teamNames - team names (used for league phase & final)
 * @param {string} phase - "league" | "playoffs" | "r16" | "quarterfinals" | "semifinals" | "final"
 * @param {Object} [context] - additional data needed for knockout phases
 * @param {string[]} [context.playoffTeams] - 16 teams for playoffs
 * @param {string[]} [context.top8] - top 8 league finishers (for R16)
 * @param {string[]} [context.playoffWinners] - 8 playoff winners (for R16)
 * @param {string[]} [context.qualifiedTeams] - teams for QF/SF rounds
 * @returns {Array<Array<Object>>}
 */
function generateUEFAFixtures(teamNames, phase, context) {
    phase = phase || "league";
    context = context || {};

    switch (phase) {
        case "league":
            return generateLeaguePhaseFixtures(teamNames);
        case "playoffs":
            return generateTwoLegFixtures(
                createPlayoffPairings(context.playoffTeams || teamNames),
            );
        case "r16":
            return generateTwoLegFixtures(
                createR16Pairings(
                    context.top8 || [],
                    context.playoffWinners || [],
                ),
            );
        case "quarterfinals":
        case "semifinals":
            return generateTwoLegFixtures(
                createKnockoutPairings(context.qualifiedTeams || teamNames),
            );
        case "final":
            return generateFinalFixture(teamNames[0], teamNames[1]);
        default:
            console.warn("Unknown UEFA phase:", phase);
            return [];
    }
}

Object.assign(window.FootballLeague.UEFA, {
    generateFixtures: generateUEFAFixtures,
    getKnockoutWinners: getKnockoutWinners,
    getTieWinner: getTieWinner,
    createPlayoffPairings: createPlayoffPairings,
    createR16Pairings: createR16Pairings,
    createKnockoutPairings: createKnockoutPairings,
});
