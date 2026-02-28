window.FootballLeague = window.FootballLeague || {};

/**
 * Application state
 */
let fixtures = [];
let table = {};

/**
 * Recalculate the entire league table from fixtures
 * @return {void}
 */
function recalcTable() {
    table = window.FootballLeague.initTable(window.FootballLeague.teams);

    fixtures
        .flat()
        .forEach((match) =>
            window.FootballLeague.applyMatchResult(match, table),
        );

    window.FootballLeague.renderTable(table);
}

/**
 * Initialize fixtures: load from storage if available, otherwise generate new ones
 * @return {void}
 */
function initializeFixtures() {
    let structure = null;

    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.readFixturesStructure
    ) {
        structure = window.FootballLeague.StorageModule.readFixturesStructure();
    }

    if (structure) {
        fixtures = structure.map((round) =>
            round.map((match) => ({
                home: match.home,
                away: match.away,
                homeGoals: null,
                awayGoals: null,
            })),
        );
    } else {
        fixtures = window.FootballLeague.generateFixtures(
            window.FootballLeague.teams,
        );
        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.writeFixturesStructure
        ) {
            window.FootballLeague.StorageModule.writeFixturesStructure(
                fixtures,
            );
        }
    }

    // restore saved results (if any) and merge into fixtures
    try {
        const savedFixtures =
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.readFixtures &&
            window.FootballLeague.StorageModule.readFixtures();

        if (savedFixtures && Array.isArray(savedFixtures)) {
            for (
                let r = 0;
                r < Math.min(savedFixtures.length, fixtures.length);
                r++
            ) {
                const round = savedFixtures[r];

                if (!Array.isArray(round)) continue;

                for (
                    let match = 0;
                    match < Math.min(round.length, fixtures[r].length);
                    match++
                ) {
                    const res = round[match];
                    if (
                        res &&
                        typeof res.homeGoals !== "undefined" &&
                        typeof res.awayGoals !== "undefined"
                    ) {
                        fixtures[r][match].homeGoals = res.homeGoals;
                        fixtures[r][match].awayGoals = res.awayGoals;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Failed to load saved results", e);
    }
}

/**
 * Regenerate fixtures and clear all progress
 * @return {void}
 */
function regenerateFixtures() {
    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.clearAll
    ) {
        window.FootballLeague.StorageModule.clearAll();
    }

    fixtures = window.FootballLeague.generateFixtures(
        window.FootballLeague.teams,
    );

    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.writeFixturesStructure
    ) {
        window.FootballLeague.StorageModule.writeFixturesStructure(fixtures);
    }

    recalcTable();
    window.FootballLeague.renderFixtures(fixtures, () => {
        recalcTable();
        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.saveFixturesDebounced
        ) {
            window.FootballLeague.StorageModule.saveFixturesDebounced(fixtures);
        }
    });
}

/**
 * Start the application
 * @return {void}
 */
function start() {
    initializeFixtures();

    recalcTable();
    window.FootballLeague.renderTable(table);

    window.FootballLeague.renderFixtures(fixtures, () => {
        recalcTable();
        window.FootballLeague.renderTable(table);
        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.saveFixturesDebounced
        ) {
            window.FootballLeague.StorageModule.saveFixturesDebounced(fixtures);
        }
    });
}

Object.assign(window.FootballLeague, {
    fixtures,
    recalcTable,
    initializeFixtures,
    regenerateFixtures,
    start,
});

start();
