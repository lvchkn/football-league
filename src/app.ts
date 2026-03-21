import type {
    LeagueList,
    UEFACompetition,
    CompetitionApp,
} from "./interfaces/tournament.js";
import * as storage from "./storage.js";
import { createDomesticApp } from "./domestic/app.js";
import { createUEFAApp } from "./uefa/uefa.js";
import {
    subscribeToLeagueChange,
    updateLeagueSelector,
    setupScrollToTopButton,
} from "./ui.js";

export let selectedLeague: LeagueList | UEFACompetition = "english";

let activeApp: CompetitionApp;

/**
 * Check if a league is a UEFA competition
 */
function isUEFACompetition(league: string): boolean {
    return ["ucl", "el", "cl"].includes(league);
}

/**
 * Create the appropriate competition app for the given league.
 */
function createApp(league: LeagueList | UEFACompetition): CompetitionApp {
    let app: CompetitionApp;

    if (isUEFACompetition(league)) {
        app = createUEFAApp(league as UEFACompetition);
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
    const persisted: LeagueList | UEFACompetition | null =
        storage.getSelectedLeague();

    if (persisted) {
        selectedLeague = persisted;
        updateLeagueSelector(selectedLeague);
    }

    activeApp = createApp(selectedLeague);

    // League-change subscription
    subscribeToLeagueChange(function (league) {
        if (activeApp) {
            activeApp.destroy();
        }

        selectedLeague = league as LeagueList | UEFACompetition;
        storage.setSelectedLeague(league as LeagueList | UEFACompetition);

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
