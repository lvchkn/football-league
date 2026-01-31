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

    const result = [];

    for (let round = 0; round < rounds; round++) {
        const matches = [];
        for (let matchIndex = 0; matchIndex < mid; matchIndex++) {
            const home = arr[matchIndex];
            const away = arr[arr.length - 1 - matchIndex];
            if (home && away) {
                matches.push({ home, away, hg: null, ag: null });
            }
        }

        result.push(matches);

        const [fixed, ...rest] = arr;
        const rotated = [rest.pop(), ...rest];
        arr = [fixed, ...rotated];
    }

    // double round robin: second half reversed
    const secondHalf = result.map((round) =>
        round.map((m) => ({
            home: m.away,
            away: m.home,
            hg: null,
            ag: null,
        }))
    );

    return [...result, ...secondHalf];
}
