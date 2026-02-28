/**
 * Minimal storage helper: persist data to localStorage.
 */
(function () {
    window.FootballLeague = window.FootballLeague || {};

    const FIXTURES_KEY = "football-league:fixtures";
    const FIXTURES_STRUCTURE_KEY = "football-league:fixtures-structure";
    const DEBOUNCE_MS = 300;

    let pending = null;

    /**
     * Extract minimal results from full fixtures: nested arrays with {homeGoals, awayGoals} or null.
     * @param {Array<Array<Object>>} fixtures
     * @returns {Array<Array<Object|null>>}
     */
    function _extractMinimal(fixtures) {
        return fixtures.map((round) =>
            round.map((match) => {
                if (!match) return null;
                if (match.homeGoals == null && match.awayGoals == null)
                    return null;
                return {
                    homeGoals: match.homeGoals,
                    awayGoals: match.awayGoals,
                };
            }),
        );
    }

    /**
     * Load persisted minimal results from localStorage.
     * @return {Array<Array<Object|null>>|null}
     */
    function readFixtures() {
        try {
            const fixtures = localStorage.getItem(FIXTURES_KEY);
            if (!fixtures) return null;
            return JSON.parse(fixtures);
        } catch (e) {
            return null;
        }
    }

    /**
     * Write fixtures to localStorage (sync).
     * @param {Array<Array<Object|null>>} fixtures
     * @return {boolean}
     */
    function _writeFixtures(fixtures) {
        try {
            localStorage.setItem(FIXTURES_KEY, JSON.stringify(fixtures));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Debounced save: accept full fixtures, extract minimal and persist later.
     * @param {Array<Array<Object>>} fixtures
     * @return {void}
     */
    function saveFixturesDebounced(fixtures) {
        if (pending) clearTimeout(pending);
        const minimal = _extractMinimal(fixtures);
        pending = setTimeout(() => {
            _writeFixtures(minimal);
            pending = null;
        }, DEBOUNCE_MS);
    }

    /**
     * Immediate save (cancels debounce) of full fixtures.
     * @param {Array<Array<Object>>} fixtures
     * @return {boolean}
     */
    function saveFixturesImmediate(fixtures) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        return _writeFixtures(_extractMinimal(fixtures));
    }

    /**
     * Clear persisted fixtures from storage.
     * @return {void}
     */
    function clearSavedFixtures() {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(FIXTURES_KEY);
        } catch (e) {
            return;
        }
    }

    /**
     * Save the fixtures structure (matchups) without results to localStorage.
     * @param {Array<Array<Object>>} fixtures
     * @return {boolean}
     */
    function writeFixturesStructure(fixtures) {
        try {
            const structure = fixtures.map((round) =>
                round.map((match) => ({
                    home: match.home,
                    away: match.away,
                })),
            );
            localStorage.setItem(
                FIXTURES_STRUCTURE_KEY,
                JSON.stringify(structure),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Load the fixture structure from localStorage.
     * @return {Array<Array<Object>>|null}
     */
    function readFixturesStructure() {
        try {
            const structure = localStorage.getItem(FIXTURES_STRUCTURE_KEY);
            if (!structure) return null;
            return JSON.parse(structure);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear both fixtures structure and results.
     * @return {void}
     */
    function clearAll() {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(FIXTURES_KEY);
            localStorage.removeItem(FIXTURES_STRUCTURE_KEY);
        } catch (e) {
            return;
        }
    }

    window.FootballLeague.StorageModule = {
        readFixtures,
        saveFixturesDebounced,
        saveFixturesImmediate,
        clearSavedFixtures,
        writeFixturesStructure,
        readFixturesStructure,
        clearAll,
    };
})();
