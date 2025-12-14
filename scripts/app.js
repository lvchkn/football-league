/**
 * Application state
 */
let fixtures = [];

/**
 * Recalculate the entire league table from fixtures
 * @return {void}
 */
function recalcTable() {
    initTable(teams);
    fixtures.flat().forEach((match) => applyMatchResult(match));
    // Render the table after applying all match results
    renderTable();
}

/**
 * Start the application
 * @return {void}
 */
function start() {
    initTable(teams);
    fixtures = generateFixtures(teams);

    // restore saved results (if any) and merge into generated fixtures
    try {
        const saved =
            window.StorageModule &&
            window.StorageModule.loadSavedResults &&
            window.StorageModule.loadSavedResults();
        if (saved && Array.isArray(saved)) {
            for (let r = 0; r < Math.min(saved.length, fixtures.length); r++) {
                const round = saved[r];
                if (!Array.isArray(round)) continue;
                for (
                    let m = 0;
                    m < Math.min(round.length, fixtures[r].length);
                    m++
                ) {
                    const s = round[m];
                    if (
                        s &&
                        typeof s.hg !== "undefined" &&
                        typeof s.ag !== "undefined"
                    ) {
                        fixtures[r][m].hg = s.hg;
                        fixtures[r][m].ag = s.ag;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Failed to load saved results", e);
    }

    // Recalculate and render standings from restored fixtures
    recalcTable();
    renderFixtures(fixtures, () => {
        recalcTable();
        // autosave on result apply (debounced)
        if (window.StorageModule && window.StorageModule.saveFixtures) {
            window.StorageModule.saveFixtures(fixtures);
        }
    });
}

start();
