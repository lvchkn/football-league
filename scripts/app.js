window.FootballLeague = window.FootballLeague || {};

/**
 * Application state
 */
let fixtures = [];
let table = {};
let selectedLeague = "english";
let teams = [];

/**
 * Recalculate the entire league table from fixtures
 * @return {void}
 */
function recalcTable() {
    table = window.FootballLeague.initTable(teams);

    fixtures
        .flat()
        .forEach((match) =>
            window.FootballLeague.applyMatchResult(match, table),
        );

    window.FootballLeague.renderTable(table);
}

/**
 * Initialize fixtures for a specific league: load from storage if available, otherwise generate new ones
 * @param {string} league
 * @return {void}
 */
function initializeFixtures(league) {
    let structure = null;

    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.readFixturesStructure
    ) {
        structure =
            window.FootballLeague.StorageModule.readFixturesStructure(league);
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
        window.FootballLeague.fixtures = fixtures;
    } else {
        fixtures = window.FootballLeague.generateFixtures(teams);
        window.FootballLeague.fixtures = fixtures;
        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.writeFixturesStructure
        ) {
            window.FootballLeague.StorageModule.writeFixturesStructure(
                fixtures,
                league,
            );
        }
    }

    // restore saved results (if any) and merge into fixtures
    try {
        const savedFixtures =
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.readFixtures &&
            window.FootballLeague.StorageModule.readFixtures(league);

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
 * Regenerate fixtures and clear all progress for the current league
 * @return {void}
 */
function regenerateFixtures() {
    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.clearAll
    ) {
        window.FootballLeague.StorageModule.clearAll(selectedLeague);
    }

    fixtures = window.FootballLeague.generateFixtures(teams);
    window.FootballLeague.fixtures = fixtures;

    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.writeFixturesStructure
    ) {
        window.FootballLeague.StorageModule.writeFixturesStructure(
            fixtures,
            selectedLeague,
        );
    }

    recalcTable();
    window.FootballLeague.renderFixtures(fixtures, () => {
        recalcTable();
        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.saveFixturesDebounced
        ) {
            window.FootballLeague.StorageModule.saveFixturesDebounced(
                fixtures,
                selectedLeague,
            );
        }
    });
}

/**
 * Start the application
 * @return {void}
 */
function start() {
    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.getSelectedLeague
    ) {
        const persistedLeague =
            window.FootballLeague.StorageModule.getSelectedLeague();
        if (persistedLeague) {
            selectedLeague = persistedLeague;
            updateLeagueSelector(selectedLeague);
        }
    }

    teams = window.FootballLeague.getTeamsByLeague(selectedLeague);
    initializeFixtures(selectedLeague);

    recalcTable();

    window.FootballLeague.renderFixtures(fixtures, () => {
        recalcTable();

        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.saveFixturesDebounced
        ) {
            window.FootballLeague.StorageModule.saveFixturesDebounced(
                fixtures,
                selectedLeague,
            );
        }
    });

    window.FootballLeague.subscribeToLeagueChange((league) => {
        selectedLeague = league;
        teams = window.FootballLeague.getTeamsByLeague(league);

        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.setSelectedLeague
        ) {
            window.FootballLeague.StorageModule.setSelectedLeague(league);
        }

        initializeFixtures(league);
        recalcTable();

        window.FootballLeague.renderFixtures(fixtures, () => {
            recalcTable();
            if (
                window.FootballLeague &&
                window.FootballLeague.StorageModule &&
                window.FootballLeague.StorageModule.saveFixturesDebounced
            ) {
                window.FootballLeague.StorageModule.saveFixturesDebounced(
                    fixtures,
                    selectedLeague,
                );
            }
        });
    });
}

Object.assign(window.FootballLeague, {
    fixtures,
    get selectedLeague() {
        return selectedLeague;
    },
    recalcTable,
    initializeFixtures,
    regenerateFixtures,
    start,
});

start();
