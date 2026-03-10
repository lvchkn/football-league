/**
 * UEFA Storage Module
 * Manages persistence of UEFA competition state: phase, fixtures, qualified teams,
 * and phase-transition context (top-8, playoff teams, etc.).
 */
(function () {
    window.FootballLeague = window.FootballLeague || {};
    window.FootballLeague.UEFA = window.FootballLeague.UEFA || {};

    var FIXTURES_KEY_PREFIX = "football-league:uefa:fixtures:";
    var STRUCTURE_KEY_PREFIX = "football-league:uefa:fixtures-structure:";
    var PHASE_KEY_PREFIX = "football-league:uefa:phase:";
    var PHASE_CONTEXT_KEY_PREFIX = "football-league:uefa:phase-context:";
    var QUALIFIED_KEY_PREFIX = "football-league:uefa:qualified-teams:";
    var DEBOUNCE_MS = 300;

    var pending = null;

    function _fixturesKey(competition) {
        return FIXTURES_KEY_PREFIX + (competition || "ucl");
    }
    function _structureKey(competition) {
        return STRUCTURE_KEY_PREFIX + (competition || "ucl");
    }
    function _phaseKey(competition) {
        return PHASE_KEY_PREFIX + (competition || "ucl");
    }
    function _phaseContextKey(competition) {
        return PHASE_CONTEXT_KEY_PREFIX + (competition || "ucl");
    }
    function _qualifiedKey(competition) {
        return QUALIFIED_KEY_PREFIX + (competition || "ucl");
    }

    function _extractMinimal(fixtures) {
        return fixtures.map(function (round) {
            return round.map(function (match) {
                if (!match) return null;
                if (match.homeGoals == null && match.awayGoals == null)
                    return null;
                return {
                    homeGoals: match.homeGoals,
                    awayGoals: match.awayGoals,
                };
            });
        });
    }

    function getFixtures(competition) {
        try {
            var raw = localStorage.getItem(_fixturesKey(competition));
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function _setFixtures(fixtures, competition) {
        try {
            localStorage.setItem(
                _fixturesKey(competition),
                JSON.stringify(fixtures),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    function setFixturesDebounced(fixtures, competition) {
        if (pending) clearTimeout(pending);
        var minimal = _extractMinimal(fixtures);
        pending = setTimeout(function () {
            _setFixtures(minimal, competition);
            pending = null;
        }, DEBOUNCE_MS);
    }

    function setFixturesImmediate(fixtures, competition) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        return _setFixtures(_extractMinimal(fixtures), competition);
    }

    function getFixturesStructure(competition) {
        try {
            var raw = localStorage.getItem(_structureKey(competition));
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setFixturesStructure(fixtures, competition) {
        try {
            var structure = fixtures.map(function (round) {
                return round.map(function (match) {
                    var entry = { home: match.home, away: match.away };
                    if (match.leg != null) entry.leg = match.leg;
                    if (match.tieIndex != null) entry.tieIndex = match.tieIndex;
                    return entry;
                });
            });
            localStorage.setItem(
                _structureKey(competition),
                JSON.stringify(structure),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    function getPhase(competition) {
        try {
            return localStorage.getItem(_phaseKey(competition)) || "league";
        } catch (e) {
            return "league";
        }
    }

    function setPhase(competition, phase) {
        try {
            localStorage.setItem(_phaseKey(competition), phase);
            return true;
        } catch (e) {
            return false;
        }
    }

    function getPhaseContext(competition) {
        try {
            var raw = localStorage.getItem(_phaseContextKey(competition));
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setPhaseContext(competition, context) {
        try {
            localStorage.setItem(
                _phaseContextKey(competition),
                JSON.stringify(context),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    function getQualifiedTeams(competition) {
        try {
            var raw = localStorage.getItem(_qualifiedKey(competition));
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setQualifiedTeams(competition, teams) {
        try {
            localStorage.setItem(
                _qualifiedKey(competition),
                JSON.stringify(teams),
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearAll(competition) {
        if (pending) {
            clearTimeout(pending);
            pending = null;
        }
        try {
            localStorage.removeItem(_fixturesKey(competition));
            localStorage.removeItem(_structureKey(competition));
            localStorage.removeItem(_phaseKey(competition));
            localStorage.removeItem(_phaseContextKey(competition));
            localStorage.removeItem(_qualifiedKey(competition));
        } catch (e) {
            console.warn("Failed to clear UEFA storage", e);
        }
    }

    window.FootballLeague.UEFA.StorageModule = {
        getFixtures,
        getFixturesStructure,
        setFixturesStructure,
        setFixturesDebounced,
        setFixturesImmediate,
        getPhase,
        setPhase,
        getPhaseContext,
        setPhaseContext,
        getQualifiedTeams,
        setQualifiedTeams,
        clearAll,
    };
})();
