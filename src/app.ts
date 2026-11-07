import type {
    LeagueList,
    TournamentKey,
    CompetitionApp,
} from "./interfaces/tournament.js";
import * as storage from "./storage.js";
import { createDomesticApp } from "./domestic/app.js";
import { createTournamentApp } from "./tournament/app.js";
import { COMPETITIONS, isCompetition, isTournament } from "./competitions.js";
import {
    careerSeasonInputs,
    domesticContext,
    isCareerCompetition,
    tournamentContext,
} from "./context.js";
import { getMode, setMode, type Mode } from "./mode.js";
import { clearCareerFixtures, loadCareer, resetCareer, saveCareer, seasonLabel } from "./career/state.js";
import { endSeason } from "./career/season.js";
import {
    openCareerHistory,
    openSeasonSummary,
    renderCareerBar,
    setupModeSwitch,
} from "./career/ui.js";
import {
    subscribeToLeagueChange,
    updateLeagueSelector,
    setupScrollToTopButton,
    populateLeagueSelector,
} from "./ui.js";

export let selectedLeague: LeagueList | TournamentKey = "english";

let activeApp: CompetitionApp;

/**
 * Create the appropriate competition app for the given league.
 */
function createApp(league: LeagueList | TournamentKey): CompetitionApp {
    const app = isTournament(league)
        ? createTournamentApp(tournamentContext(league))
        : createDomesticApp(domesticContext(league));
    app.init();
    return app;
}

/** Competitions offered in the current mode, in dropdown order. */
function availableCompetitions() {
    return getMode() === "career"
        ? COMPETITIONS.filter(([id]) => isCareerCompetition(id))
        : COMPETITIONS;
}

/**
 * Rebuild the dropdown, mode switch and career bar, then (re)start the app
 * for the selected competition, falling back to the first one on offer.
 */
function refresh(): void {
    const mode = getMode();
    const competitions = availableCompetitions();
    populateLeagueSelector(competitions);
    if (!competitions.some(([id]) => id === selectedLeague)) {
        selectedLeague = competitions[0]![0];
    }
    updateLeagueSelector(selectedLeague);

    setupModeSwitch(mode, function (next) {
        activeApp?.save();
        activeApp?.destroy();
        setMode(next as Mode);
        refresh();
    });

    renderCareerBar(mode === "career" ? loadCareer() : null, {
        onEndSeason: endCareerSeason,
        onShowHistory: () => openCareerHistory(loadCareer().history),
        onReset: function () {
            if (!confirm("Reset the career? Every season so far will be lost.")) return;
            activeApp?.destroy();
            resetCareer();
            refresh();
        },
    });

    activeApp = createApp(selectedLeague);
}

function endCareerSeason(): void {
    const state = loadCareer();
    if (
        !confirm(
            `End the ${seasonLabel(state.season)} season? ` +
                "Unplayed domestic matches will be simulated, and European competitions " +
                "will restart with next season's qualifiers.",
        )
    ) {
        return;
    }

    activeApp?.save();
    activeApp?.destroy();
    const { next, summary } = endSeason(state, careerSeasonInputs(state));
    saveCareer(next);
    clearCareerFixtures();
    refresh();
    openSeasonSummary(summary);
}

/**
 * Start the application.
 */
function start(): void {
    const persisted = storage.getSelectedLeague();
    if (persisted && isCompetition(persisted)) {
        selectedLeague = persisted;
    }

    refresh();

    // League-change subscription
    subscribeToLeagueChange(function (league) {
        if (activeApp) {
            activeApp.destroy();
        }

        selectedLeague = league as LeagueList | TournamentKey;
        storage.setSelectedLeague(league as LeagueList | TournamentKey);

        // Re-show standings section when switching leagues (might have been hidden)
        const standingsSection: HTMLElement | null =
            document.querySelector(".standings-section");

        if (standingsSection) standingsSection.style.display = "";

        activeApp = createApp(selectedLeague);
    });

    document.getElementById("save-btn")?.addEventListener("click", function () {
        activeApp.save();
        alert("Saved!");
    });

    document
        .getElementById("reset-btn")
        ?.addEventListener("click", function () {
            if (confirm("Reset all scores to 0?")) {
                activeApp.reset();
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
                activeApp.regenerate();
            }
        });

    setupScrollToTopButton();
}

start();
