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
     * @param {string} league
     * @return {string}
     */
    function _getFixturesKey(league) {
        return `${FIXTURES_KEY_PREFIX}${league || "english"}`;
    }

    /**
     * Get the storage key for fixture structure of a specific league.
     * @param {string} league
     * @return {string}
     */
    function _getStructureKey(league) {
        return `${FIXTURES_STRUCTURE_KEY_PREFIX}${league || "english"}`;
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
     * @param {string} league
     * @return {Array<Array<Object|null>>|null}
     */
    function getFixtures(league) {
        try {
            const fixtures = localStorage.getItem(_getFixturesKey(league));
            if (!fixtures) return null;
            return JSON.parse(fixtures);
        } catch (e) {
            return null;
        }
    }

    /**
     * Write fixtures to localStorage (sync).
     * @param {Array<Array<Object|null>>} fixtures
     * @param {string} league
     * @return {boolean}
     */
    function _setFixtures(fixtures, league) {
        try {
            localStorage.setItem(
                _getFixturesKey(league),
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
     * @param {string} league
     * @return {void}
     */
    function setFixturesDebounced(fixtures, league) {
        if (pending) clearTimeout(pending);
        const minimal = _extractMinimal(fixtures);
        pending = setTimeout(() => {
            _setFixtures(minimal, league);
            pending = null;
        }, DEBOUNCE_MS);
    }

    /**
     * Immediate save (cancels debounce) of full fixtures.
     * @param {Array<Array<Object>>} fixtures
     * @param {string} league
     * @return {boolean}
     */
    function setFixturesImmediate(fixtures, league) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        return _setFixtures(_extractMinimal(fixtures), league);
    }

    /**
     * Clear persisted fixtures from storage.
     * @param {string} league
     * @return {void}
     */
    function clearSavedFixtures(league) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(_getFixturesKey(league));
        } catch (e) {
            return;
        }
    }

    /**
     * Save the fixtures structure (matchups) without results to localStorage.
     * @param {Array<Array<Object>>} fixtures
     * @param {string} league
     * @return {boolean}
     */
    function setFixturesStructure(fixtures, league) {
        try {
            const structure = fixtures.map((round) =>
                round.map((match) => ({
                    home: match.home,
                    away: match.away,
                })),
            );
            localStorage.setItem(
                _getStructureKey(league),
                JSON.stringify(structure),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Load the fixture structure from localStorage.
     * @param {string} league
     * @return {Array<Array<Object>>|null}
     */
    function getFixturesStructure(league) {
        try {
            const structure = localStorage.getItem(_getStructureKey(league));
            if (!structure) return null;
            return JSON.parse(structure);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear both fixtures structure and results for a league.
     * @param {string} league
     * @return {void}
     */
    function clearAll(league) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(_getFixturesKey(league));
            localStorage.removeItem(_getStructureKey(league));
        } catch (e) {
            return;
        }
    }

    /**
     * Get the currently active league ID from storage.
     * @return {string|null}
     */
    function getSelectedLeague() {
        try {
            return localStorage.getItem(SELECTED_LEAGUE_KEY);
        } catch (e) {
            return null;
        }
    }

    /**
     * Set the currently active league ID in storage.
     * @param {string} league
     * @return {boolean}
     */
    function setSelectedLeague(league) {
        try {
            localStorage.setItem(SELECTED_LEAGUE_KEY, league);
            return true;
        } catch (e) {
            return false;
        }
    }

    window.FootballLeague.StorageModule = {
        getFixtures,
        setFixturesDebounced,
        setFixturesImmediate,
        clearSavedFixtures,
        setFixturesStructure,
        getFixturesStructure,
        clearAll,
        getSelectedLeague,
        setSelectedLeague,
    };
})();
