/**
 * Minimal storage helper: persist only the fixture input data (hg/ag) to localStorage.
 * Exposes a small global `StorageModule` used by the app (non-module environment).
 */
(function () {
    const STORAGE_KEY = "football-league:fixtures";
    const DEBOUNCE_MS = 300;

    let pending = null;

    /**
     * Extract minimal results from full fixtures: nested arrays with {hg,ag} or null.
     * @param {Array<Array<Object>>} fixtures
     * @returns {Array<Array<Object|null>>}
     */
    function extractMinimal(fixtures) {
        return fixtures.map((round) =>
            round.map((m) => {
                if (!m) return null;
                if (m.hg == null && m.ag == null) return null;
                return { hg: m.hg, ag: m.ag };
            })
        );
    }

    /**
     * Load persisted minimal results from localStorage.
     * @returns {Array<Array<Object|null>>|null}
     */
    function loadSavedResults() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    /**
     * Write minimal results to localStorage (sync).
     * @param {Array<Array<Object|null>>} minimal
     * @returns {boolean}
     */
    function doSave(minimal) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Debounced save: accept full fixtures, extract minimal and persist later.
     * @param {Array<Array<Object>>} fixtures
     */
    function saveFixtures(fixtures) {
        if (pending) clearTimeout(pending);
        const minimal = extractMinimal(fixtures);
        pending = setTimeout(() => {
            doSave(minimal);
            pending = null;
        }, DEBOUNCE_MS);
    }

    /**
     * Immediate save (cancels debounce) of full fixtures.
     * @param {Array<Array<Object>>} fixtures
     * @returns {boolean}
     */
    function immediateSaveFixtures(fixtures) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        return doSave(extractMinimal(fixtures));
    }

    /**
     * Clear persisted results from storage.
     * @return {void}
     */
    function clearSavedResults() {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            /* ignore */
        }
    }

    window.StorageModule = {
        loadSavedResults,
        saveFixtures,
        immediateSaveFixtures,
        clearSavedResults,
    };
})();
