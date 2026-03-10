window.FootballLeague = window.FootballLeague || {};

/**
 * Application state
 */
var fixtures = [];
var table = {};
var selectedLeague = "english";
var teams = [];
var currentUEFAPhase = "league"; // UEFA phase tracker

/**
 * Check if a league is a UEFA competition
 * @param {string} league
 * @return {boolean}
 */
function isUEFACompetition(league) {
    return ["ucl", "el", "cl"].includes(league);
}

/**
 * Recalculate the league table from fixtures.
 * For UEFA competitions the table is only relevant during the league phase;
 * knockout phases do not feed into a league table.
 * @return {void}
 */
function recalcTable() {
    var isUEFA = isUEFACompetition(selectedLeague);

    if (isUEFA) {
        if (currentUEFAPhase === "league") {
            table = window.FootballLeague.UEFA.initTable(teams);
            fixtures.flat().forEach(function (match) {
                window.FootballLeague.UEFA.applyMatchResult(match, table);
            });
            window.FootballLeague.UEFA.renderTable(table, currentUEFAPhase);
        } else {
            // In knockout phases there is no league table to show
            window.FootballLeague.UEFA.renderTable({}, currentUEFAPhase);
        }
    } else {
        table = window.FootballLeague.initTable(teams);
        fixtures.flat().forEach(function (match) {
            window.FootballLeague.applyMatchResult(match, table);
        });
        window.FootballLeague.renderTable(table);
    }
}

/**
 * Initialize fixtures for a specific league.
 * Loads persisted fixture structure and results from storage when available,
 * otherwise generates fresh fixtures.
 * @param {string} league
 * @return {void}
 */
function initializeFixtures(league) {
    var isUEFA = isUEFACompetition(league);
    var storageModule = isUEFA
        ? window.FootballLeague.UEFA.StorageModule
        : window.FootballLeague.StorageModule;

    // Restore phase for UEFA
    if (isUEFA && storageModule.getPhase) {
        currentUEFAPhase = storageModule.getPhase(league);
    } else {
        currentUEFAPhase = "league";
    }

    // Try to load persisted fixture structure
    var structure = null;
    if (storageModule && storageModule.getFixturesStructure) {
        structure = storageModule.getFixturesStructure(league);
    }

    if (structure) {
        fixtures = structure.map(function (round) {
            return round.map(function (match) {
                return {
                    home: match.home,
                    away: match.away,
                    homeGoals: null,
                    awayGoals: null,
                    leg: match.leg != null ? match.leg : undefined,
                    tieIndex:
                        match.tieIndex != null ? match.tieIndex : undefined,
                };
            });
        });
        window.FootballLeague.fixtures = fixtures;
    } else {
        if (isUEFA) {
            currentUEFAPhase = "league";
            fixtures = window.FootballLeague.UEFA.generateFixtures(
                teams,
                currentUEFAPhase,
            );
        } else {
            fixtures = window.FootballLeague.generateFixtures(teams);
        }
        window.FootballLeague.fixtures = fixtures;

        if (storageModule && storageModule.setFixturesStructure) {
            storageModule.setFixturesStructure(fixtures, league);
        }
        if (isUEFA && storageModule.setPhase) {
            storageModule.setPhase(league, currentUEFAPhase);
        }
    }

    // Merge saved results over the skeleton
    try {
        var saved =
            storageModule &&
            storageModule.getFixtures &&
            storageModule.getFixtures(league);

        if (saved && Array.isArray(saved)) {
            for (var r = 0; r < Math.min(saved.length, fixtures.length); r++) {
                var round = saved[r];
                if (!Array.isArray(round)) continue;
                for (
                    var m = 0;
                    m < Math.min(round.length, fixtures[r].length);
                    m++
                ) {
                    var res = round[m];
                    if (
                        res &&
                        typeof res.homeGoals !== "undefined" &&
                        typeof res.awayGoals !== "undefined"
                    ) {
                        fixtures[r][m].homeGoals = res.homeGoals;
                        fixtures[r][m].awayGoals = res.awayGoals;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Failed to load saved results", e);
    }
}

/**
 * Regenerate fixtures and clear all progress for the current league.
 * For UEFA this resets back to the league phase.
 * @return {void}
 */
function regenerateFixtures() {
    var isUEFA = isUEFACompetition(selectedLeague);
    var storageModule = isUEFA
        ? window.FootballLeague.UEFA.StorageModule
        : window.FootballLeague.StorageModule;

    if (storageModule && storageModule.clearAll) {
        storageModule.clearAll(selectedLeague);
    }

    if (isUEFA) {
        currentUEFAPhase = "league";
        fixtures = window.FootballLeague.UEFA.generateFixtures(
            _shuffleArray(teams),
            currentUEFAPhase,
        );
        if (storageModule.setPhase) {
            storageModule.setPhase(selectedLeague, currentUEFAPhase);
        }
    } else {
        fixtures = window.FootballLeague.generateFixtures(_shuffleArray(teams));
    }

    window.FootballLeague.fixtures = fixtures;

    if (storageModule && storageModule.setFixturesStructure) {
        storageModule.setFixturesStructure(fixtures, selectedLeague);
    }

    // Re-show standings section if it was hidden during a knockout phase
    var standingsSection = document.querySelector(".standings-section");
    if (standingsSection) standingsSection.style.display = "";

    recalcTable();
    renderFixtures();
}

/**
 * Render fixtures for the current league (UEFA-aware).
 * @return {void}
 */
function renderFixtures() {
    var isUEFA = isUEFACompetition(selectedLeague);

    var onResultApplied = function () {
        recalcTable();

        var storageModule = isUEFA
            ? window.FootballLeague.UEFA.StorageModule
            : window.FootballLeague.StorageModule;

        if (storageModule && storageModule.setFixturesDebounced) {
            storageModule.setFixturesDebounced(fixtures, selectedLeague);
        }
    };

    if (isUEFA) {
        window.FootballLeague.UEFA.renderFixtures(
            fixtures,
            onResultApplied,
            currentUEFAPhase,
        );
        // Only show progression button if competition is not finished
        if (currentUEFAPhase !== "finished") {
            window.FootballLeague.UEFA.renderPhaseProgressionButtons(
                function () {
                    progressCompetition();
                },
            );
        }
    } else {
        window.FootballLeague.renderFixtures(fixtures, onResultApplied);
    }
}

/**
 * Progress a UEFA competition through its phases:
 *   League → Playoffs → Round of 16 → Quarter-finals → Semi-finals → Final → Finished
 *
 * Phase transitions determine advancing teams from actual match results:
 * - League: top 8 auto-qualify for R16, teams 9-24 go to playoffs, 25-36 eliminated.
 * - Playoffs: aggregate scores decide 8 winners who join the top 8 in R16.
 * - Knockout rounds: aggregate scores decide winners for the next round.
 * - Final: single match decides the winner.
 * @return {void}
 */
function progressCompetition() {
    if (!isUEFACompetition(selectedLeague)) return;

    // Verify all matches in the current phase are complete
    var allMatches = fixtures.flat();
    var incomplete = allMatches.some(function (m) {
        return m.homeGoals === null || m.awayGoals === null;
    });
    if (incomplete) {
        alert(
            "Please complete all matches in the current phase before advancing.",
        );
        return;
    }

    var storage = window.FootballLeague.UEFA.StorageModule;
    var nextPhase;
    var nextFixtures;

    switch (currentUEFAPhase) {
        case "league": {
            // Compute final league standings
            var sorted = window.FootballLeague.UEFA.sortTable(table);
            var top8 = sorted.slice(0, 8).map(function (t) {
                return t.team;
            });
            var playoffTeams = sorted.slice(8, 24).map(function (t) {
                return t.team;
            });

            nextPhase = "playoffs";
            nextFixtures = window.FootballLeague.UEFA.generateFixtures(
                null,
                "playoffs",
                { playoffTeams: playoffTeams },
            );

            // Persist context so we know who the top 8 are when building R16
            storage.setPhaseContext(selectedLeague, {
                top8: top8,
                playoffTeams: playoffTeams,
            });
            break;
        }

        case "playoffs": {
            var winners =
                window.FootballLeague.UEFA.getKnockoutWinners(fixtures);
            if (winners.length !== 8) {
                alert(
                    "Could not determine all 8 playoff winners. Check results.",
                );
                return;
            }

            var ctx = storage.getPhaseContext(selectedLeague) || {};
            var top8FromLeague = ctx.top8 || [];

            nextPhase = "r16";
            nextFixtures = window.FootballLeague.UEFA.generateFixtures(
                null,
                "r16",
                {
                    top8: top8FromLeague,
                    playoffWinners: winners,
                },
            );

            storage.setPhaseContext(selectedLeague, {
                top8: top8FromLeague,
                playoffWinners: winners,
            });
            break;
        }

        case "r16": {
            var winners =
                window.FootballLeague.UEFA.getKnockoutWinners(fixtures);
            if (winners.length !== 8) {
                alert(
                    "Could not determine all 8 Round-of-16 winners. Check results.",
                );
                return;
            }
            nextPhase = "quarterfinals";
            nextFixtures = window.FootballLeague.UEFA.generateFixtures(
                null,
                "quarterfinals",
                { qualifiedTeams: winners },
            );
            storage.setPhaseContext(selectedLeague, {
                qualifiedTeams: winners,
            });
            break;
        }

        case "quarterfinals": {
            var winners =
                window.FootballLeague.UEFA.getKnockoutWinners(fixtures);
            if (winners.length !== 4) {
                alert(
                    "Could not determine all 4 Quarter-final winners. Check results.",
                );
                return;
            }
            nextPhase = "semifinals";
            nextFixtures = window.FootballLeague.UEFA.generateFixtures(
                null,
                "semifinals",
                { qualifiedTeams: winners },
            );
            storage.setPhaseContext(selectedLeague, {
                qualifiedTeams: winners,
            });
            break;
        }

        case "semifinals": {
            var winners =
                window.FootballLeague.UEFA.getKnockoutWinners(fixtures);
            if (winners.length !== 2) {
                alert(
                    "Could not determine both Semi-final winners. Check results.",
                );
                return;
            }
            nextPhase = "final";
            nextFixtures = window.FootballLeague.UEFA.generateFixtures(
                winners,
                "final",
            );
            storage.setPhaseContext(selectedLeague, { finalists: winners });
            break;
        }

        case "final": {
            var finalMatch = fixtures[0][0];
            var champion;
            if (finalMatch.homeGoals > finalMatch.awayGoals) {
                champion = finalMatch.home;
            } else if (finalMatch.awayGoals > finalMatch.homeGoals) {
                champion = finalMatch.away;
            } else {
                // Draw in the final — home team wins (simulating penalties)
                champion = finalMatch.home;
            }
            alert(champion + " wins the competition! 🏆");
            currentUEFAPhase = "finished";
            storage.setPhase(selectedLeague, "finished");
            return;
        }

        default:
            return;
    }

    // Apply the transition
    currentUEFAPhase = nextPhase;
    fixtures = nextFixtures;
    window.FootballLeague.fixtures = fixtures;

    storage.setPhase(selectedLeague, nextPhase);
    storage.setFixturesStructure(fixtures, selectedLeague);

    recalcTable();
    renderFixtures();
}

/**
 * Start the application.
 * @return {void}
 */
function start() {
    // Restore persisted league selection
    if (
        window.FootballLeague &&
        window.FootballLeague.StorageModule &&
        window.FootballLeague.StorageModule.getSelectedLeague
    ) {
        var persisted = window.FootballLeague.StorageModule.getSelectedLeague();
        if (persisted) {
            selectedLeague = persisted;
            updateLeagueSelector(selectedLeague);
        }
    }

    var isUEFA = isUEFACompetition(selectedLeague);
    teams = isUEFA
        ? window.FootballLeague.UEFA.getTeams(selectedLeague)
        : window.FootballLeague.getTeamsByLeague(selectedLeague);

    initializeFixtures(selectedLeague);
    recalcTable();
    renderFixtures();

    // League-change subscription
    window.FootballLeague.subscribeToLeagueChange(function (league) {
        selectedLeague = league;

        var isUEFA = isUEFACompetition(league);
        teams = isUEFA
            ? window.FootballLeague.UEFA.getTeams(league)
            : window.FootballLeague.getTeamsByLeague(league);

        if (
            window.FootballLeague &&
            window.FootballLeague.StorageModule &&
            window.FootballLeague.StorageModule.setSelectedLeague
        ) {
            window.FootballLeague.StorageModule.setSelectedLeague(league);
        }

        // Re-show standings section when switching leagues (might have been hidden)
        var standingsSection = document.querySelector(".standings-section");
        if (standingsSection) standingsSection.style.display = "";

        initializeFixtures(league);
        recalcTable();
        renderFixtures();
    });

    // ── Button handlers ──────────────────────────────────────────

    document.getElementById("save-btn")?.addEventListener("click", function () {
        var isUEFA = isUEFACompetition(selectedLeague);
        var storageModule = isUEFA
            ? window.FootballLeague.UEFA.StorageModule
            : window.FootballLeague.StorageModule;

        if (storageModule && storageModule.setFixturesImmediate) {
            storageModule.setFixturesImmediate(fixtures, selectedLeague);
        }
        alert("Saved!");
    });

    document
        .getElementById("reset-btn")
        ?.addEventListener("click", function () {
            if (confirm("Reset all scores to 0?")) {
                fixtures = fixtures.map(function (round) {
                    return round.map(function (match) {
                        return {
                            home: match.home,
                            away: match.away,
                            homeGoals: null,
                            awayGoals: null,
                            leg: match.leg,
                            tieIndex: match.tieIndex,
                        };
                    });
                });
                recalcTable();
                renderFixtures();

                var isUEFA = isUEFACompetition(selectedLeague);
                var storageModule = isUEFA
                    ? window.FootballLeague.UEFA.StorageModule
                    : window.FootballLeague.StorageModule;

                if (storageModule && storageModule.setFixturesImmediate) {
                    storageModule.setFixturesImmediate(
                        fixtures,
                        selectedLeague,
                    );
                }
            }
        });

    document
        .getElementById("regenerate-btn")
        ?.addEventListener("click", function () {
            if (
                confirm(
                    "Regenerate all fixtures? All current progress will be lost.",
                )
            ) {
                regenerateFixtures();
            }
        });

    // Scroll-to-top
    var scrollBtn = document.getElementById("scroll-to-top");
    if (scrollBtn) {
        window.addEventListener("scroll", function () {
            scrollBtn.style.display = window.scrollY > 300 ? "block" : "none";
        });
        scrollBtn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

Object.assign(window.FootballLeague, {
    fixtures: fixtures,
    get selectedLeague() {
        return selectedLeague;
    },
    recalcTable: recalcTable,
    initializeFixtures: initializeFixtures,
    regenerateFixtures: regenerateFixtures,
    progressCompetition: progressCompetition,
    start: start,
});

start();
