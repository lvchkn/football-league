window.FootballLeague = window.FootballLeague || {};

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - array to shuffle
 * @returns {Array} - shuffled array
 */
function _shuffleArray(array) {
    const shuffled = array.slice();

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Round-robin fixture generation (circle method)
 * @param {string[]} teamNames - array of team names
 * @returns {Array} - array of rounds, each round is array of matches
 */
function generateFixtures(teamNames) {
    const n = teamNames.length;
    let arr = teamNames.slice();

    if (n % 2 === 1) arr.push(null); // ghost team if odd number

    const rounds = arr.length - 1;
    const mid = arr.length / 2;

    const firstHalf = [];

    for (let round = 0; round < rounds; round++) {
        const matches = [];
        for (let matchIndex = 0; matchIndex < mid; matchIndex++) {
            const home = arr[matchIndex];
            const away = arr[arr.length - 1 - matchIndex];
            if (home && away) {
                matches.push({ home, away, homeGoals: null, awayGoals: null });
            }
        }

        const shuffledMatches = _shuffleArray(matches);
        firstHalf.push(shuffledMatches);

        const [fixed, ...rest] = arr;
        const rotated = [rest.pop(), ...rest];
        arr = [fixed, ...rotated];
    }

    const secondHalf = firstHalf.map((round) =>
        round.map((m) => ({
            home: m.away,
            away: m.home,
            homeGoals: null,
            awayGoals: null,
        })),
    );

    const secondHalfShuffled = secondHalf.map((round) => _shuffleArray(round));

    const allMatches = [...firstHalf, ...secondHalfShuffled];

    return allMatches;
}

window.FootballLeague.generateFixtures = generateFixtures;
