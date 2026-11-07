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
    let app: CompetitionApp;

    if (isTournament(league)) {
        app = createTournamentApp(league as TournamentKey);
        app.init();
        return app;
    }

    app = createDomesticApp(league as LeagueList);
    app.init();
    return app;
}

/**
 * Start the application.
 */
function start(): void {
    const persisted: LeagueList | TournamentKey | null =
        storage.getSelectedLeague();

    populateLeagueSelector(COMPETITIONS);

    if (persisted && isCompetition(persisted)) {
        selectedLeague = persisted;
    }
    updateLeagueSelector(selectedLeague);

    activeApp = createApp(selectedLeague);

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
