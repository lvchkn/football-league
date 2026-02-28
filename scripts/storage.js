/**
 * Minimal storage helper: persist data to localStorage.
 */
(function () {
    window.FootballLeague = window.FootballLeague || {};

    const FIXTURES_KEY_PREFIX = "football-league:fixtures:";
    const FIXTURES_STRUCTURE_KEY_PREFIX = "football-league:fixtures-structure:";
    const SELECTED_LEAGUE_KEY = "football-league:selected-league";
    const DEBOUNCE_MS = 300;

    let pending = null;

    /**
     * Get the storage key for fixtures of a specific league.
     * @param {string} leagueId
     * @return {string}
     */
    function _getFixturesKey(leagueId) {
        return `${FIXTURES_KEY_PREFIX}${leagueId || "english"}`;
    }

    /**
     * Get the storage key for fixture structure of a specific league.
     * @param {string} leagueId
     * @return {string}
     */
    function _getStructureKey(leagueId) {
        return `${FIXTURES_STRUCTURE_KEY_PREFIX}${leagueId || "english"}`;
    }

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
     * @param {string} leagueId
     * @return {Array<Array<Object|null>>|null}
     */
    function readFixtures(leagueId) {
        try {
            const fixtures = localStorage.getItem(_getFixturesKey(leagueId));
            if (!fixtures) return null;
            return JSON.parse(fixtures);
        } catch (e) {
            return null;
        }
    }

    /**
     * Write fixtures to localStorage (sync).
     * @param {Array<Array<Object|null>>} fixtures
     * @param {string} leagueId
     * @return {boolean}
     */
    function _writeFixtures(fixtures, leagueId) {
        try {
            localStorage.setItem(
                _getFixturesKey(leagueId),
                JSON.stringify(fixtures),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Debounced save: accept full fixtures, extract minimal and persist later.
     * @param {Array<Array<Object>>} fixtures
     * @param {string} leagueId
     * @return {void}
     */
    function saveFixturesDebounced(fixtures, leagueId) {
        if (pending) clearTimeout(pending);
        const minimal = _extractMinimal(fixtures);
        pending = setTimeout(() => {
            _writeFixtures(minimal, leagueId);
            pending = null;
        }, DEBOUNCE_MS);
    }

    /**
     * Immediate save (cancels debounce) of full fixtures.
     * @param {Array<Array<Object>>} fixtures
     * @param {string} leagueId
     * @return {boolean}
     */
    function saveFixturesImmediate(fixtures, leagueId) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        return _writeFixtures(_extractMinimal(fixtures), leagueId);
    }

    /**
     * Clear persisted fixtures from storage.
     * @param {string} leagueId
     * @return {void}
     */
    function clearSavedFixtures(leagueId) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(_getFixturesKey(leagueId));
        } catch (e) {
            return;
        }
    }

    /**
     * Save the fixtures structure (matchups) without results to localStorage.
     * @param {Array<Array<Object>>} fixtures
     * @param {string} leagueId
     * @return {boolean}
     */
    function writeFixturesStructure(fixtures, leagueId) {
        try {
            const structure = fixtures.map((round) =>
                round.map((match) => ({
                    home: match.home,
                    away: match.away,
                })),
            );
            localStorage.setItem(
                _getStructureKey(leagueId),
                JSON.stringify(structure),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Load the fixture structure from localStorage.
     * @param {string} leagueId
     * @return {Array<Array<Object>>|null}
     */
    function readFixturesStructure(leagueId) {
        try {
            const structure = localStorage.getItem(_getStructureKey(leagueId));
            if (!structure) return null;
            return JSON.parse(structure);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear both fixtures structure and results for a league.
     * @param {string} leagueId
     * @return {void}
     */
    function clearAll(leagueId) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(_getFixturesKey(leagueId));
            localStorage.removeItem(_getStructureKey(leagueId));
        } catch (e) {
            return;
        }
    }

    /**
     * Get the currently active league ID from storage.
     * @return {string|null}
     */
    function getSelectedLeague() {
        return localStorage.getItem(SELECTED_LEAGUE_KEY);
    }

    /**
     * Set the currently active league ID in storage.
     * @param {string} leagueId
     * @return {void}
     */
    function setSelectedLeague(leagueId) {
        localStorage.setItem(SELECTED_LEAGUE_KEY, leagueId);
    }

    window.FootballLeague.StorageModule = {
        readFixtures,
        saveFixturesDebounced,
        saveFixturesImmediate,
        clearSavedFixtures,
        writeFixturesStructure,
        readFixturesStructure,
        clearAll,
        getSelectedLeague,
        setSelectedLeague,
    };
})();
