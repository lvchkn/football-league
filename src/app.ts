import { subscribeToLeagueChange, updateLeagueSelector } from "./ui.js";
import * as storage from "./storage.js";
import type { LeagueList } from "./teams.js";
import type { UEFACompetition } from "./uefa/teams.js";

import * as domesticApp from "./domesticApp.js";
import * as uefaApp from "./uefaApp.js";

export let selectedLeague: LeagueList | UEFACompetition = "english";

/**
 * Check if a league is a UEFA competition
 * @param {string} league
 * @return {boolean}
 */
function isUEFACompetition(league: string): boolean {
    return ["ucl", "el", "cl"].includes(league);
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

    // Initialize the appropriate app
    if (isUEFACompetition(selectedLeague)) {
        uefaApp.init(selectedLeague as UEFACompetition);
    } else {
        domesticApp.init(selectedLeague as LeagueList);
    }

    // League-change subscription
    subscribeToLeagueChange(function (league) {
        selectedLeague = league as LeagueList | UEFACompetition;
        storage.setSelectedLeague(league as LeagueList | UEFACompetition);

        // Re-show standings section when switching leagues (might have been hidden)
        const standingsSection: HTMLElement | null =
            document.querySelector(".standings-section");

        if (standingsSection) standingsSection.style.display = "";

        // Re-initialize the appropriate app
        const uefa = isUEFACompetition(league);
        if (uefa) {
            uefaApp.init(league as UEFACompetition);
        } else {
            domesticApp.init(league as LeagueList);
        }
    });

    document.getElementById("save-btn")?.addEventListener("click", function () {
        if (isUEFACompetition(selectedLeague)) {
            uefaApp.save();
        } else {
            domesticApp.save();
        }
        alert("Saved!");
    });

    document
        .getElementById("reset-btn")
        ?.addEventListener("click", function () {
            if (confirm("Reset all scores to 0?")) {
                if (isUEFACompetition(selectedLeague)) {
                    uefaApp.reset();
                } else {
                    domesticApp.reset();
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
                if (isUEFACompetition(selectedLeague)) {
                    uefaApp.regenerate();
                } else {
                    domesticApp.regenerate();
                }
            }
        });

    const scrollButton: HTMLElement | null =
        document.getElementById("scroll-to-top");

    if (scrollButton) {
        window.addEventListener("scroll", function () {
            scrollButton.style.display =
                window.scrollY > 300 ? "block" : "none";
        });

        scrollButton.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

start();
