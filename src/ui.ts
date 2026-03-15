import { sortTable } from "./table.js";
import type {
    LeagueMatch,
    LeaguePhase,
    LeagueRound,
    MatchResult,
} from "./uefa/fixtures.js";
import type { Table, TableRow } from "./uefa/table.js";

/**
 * Render the league table in the HTML
 * @param {Table} table
 * @return {void}
 */
export function renderTable(table: Table): void {
    const tbody: HTMLElement | null =
        document.querySelector("#standings tbody");

    if (!tbody) return;

    tbody.innerHTML = "";

    const sortedTableRows: TableRow[] = sortTable(table);

    sortedTableRows.forEach((row, i) => {
        const tr: HTMLTableRowElement = document.createElement("tr");

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${row.team}</td>
            <td>${row.played}</td>
            <td>${row.wins}</td>
            <td>${row.draws}</td>
            <td>${row.losses}</td>
            <td>${row.gf}</td>
            <td>${row.ga}</td>
            <td>${row.gf - row.ga}</td>
            <td>${row.points}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Render the fixtures in the HTML
 * @param {Array} fixtures - array of rounds, each round is array of matches
 * @param {Function} onResultApplied - callback when result is applied
 * @return {void}
 */
export function renderFixtures(
    fixtures: LeaguePhase,
    onResultApplied: () => void,
): void {
    const container: HTMLElement | null = document.getElementById("fixtures");

    if (!container) return;

    container.innerHTML = "";

    fixtures.forEach((round: LeagueRound, i: number) => {
        const div: HTMLDivElement = document.createElement("div");
        div.className = "matchday";
        div.innerHTML = `<h3>Matchday ${i + 1}</h3>`;

        round.matches.forEach((match: LeagueMatch, idx: number) => {
            const line: HTMLDivElement = document.createElement("div");
            line.className = "match";

            const id = `r${i}_m${idx}`;

            line.innerHTML = `
                ${match.homeTeam} 
                <input type="number" id="${id}_hg" min="0" style="width:40px" value="${
                    match.homeGoals != null ? match.homeGoals : ""
                }"> 
                -
                <input type="number" id="${id}_ag" min="0" style="width:40px" value="${
                    match.awayGoals != null ? match.awayGoals : ""
                }"> 
                ${match.awayTeam}
                <button id="${id}_btn">Apply result</button>
            `;

            const applyButton: HTMLButtonElement | null = line.querySelector(
                `#${id}_btn`,
            );

            applyButton?.addEventListener("click", () => {
                const homeGoalsInput: HTMLInputElement | null =
                    line.querySelector(`#${id}_hg`);

                const awayGoalsInput: HTMLInputElement | null =
                    line.querySelector(`#${id}_ag`);

                if (!homeGoalsInput || !awayGoalsInput) return;

                const homeGoalsValue: string = homeGoalsInput.value;
                const awayGoalsValue: string = awayGoalsInput.value;

                if (homeGoalsValue === "" || awayGoalsValue === "") return;

                const parsedInput = _getHomeAndAwayGoals(
                    homeGoalsValue,
                    awayGoalsValue,
                );

                if (!parsedInput) return;

                const { homeGoals, awayGoals } = parsedInput;
                match.homeGoals = homeGoals;
                match.awayGoals = awayGoals;

                onResultApplied();
            });

            div.appendChild(line);
        });

        const applyAllResultsButton: HTMLButtonElement =
            document.createElement("button");
        applyAllResultsButton.className = "apply-all-btn";
        applyAllResultsButton.textContent = "Apply all results";

        applyAllResultsButton.addEventListener("click", () => {
            round.matches.forEach((match: LeagueMatch, idx: number) => {
                const id = `r${i}_m${idx}`;

                const homeGoalsInput: HTMLInputElement | null =
                    div.querySelector(`#${id}_hg`);

                const awayGoalsInput: HTMLInputElement | null =
                    div.querySelector(`#${id}_ag`);

                if (!homeGoalsInput || !awayGoalsInput) return;

                const homeGoalsValue: string = homeGoalsInput.value;
                const awayGoalsValue: string = awayGoalsInput.value;

                if (homeGoalsValue === "" || awayGoalsValue === "") return;

                const parsedInput = _getHomeAndAwayGoals(
                    homeGoalsValue,
                    awayGoalsValue,
                );

                if (!parsedInput) return;

                const { homeGoals, awayGoals } = parsedInput;
                match.homeGoals = homeGoals;
                match.awayGoals = awayGoals;
            });

            onResultApplied();
        });

        div.appendChild(applyAllResultsButton);

        container.appendChild(div);
    });
}

/**
 * Get home and away goals from input values, with validation
 * @param {string} homeGoalsValue - home goals input value
 * @param {string} awayGoalsValue - away goals input value
 * @return {MatchResult | undefined} {homeGoals, awayGoals} or undefined if invalid
 */
function _getHomeAndAwayGoals(
    homeGoalsValue: string,
    awayGoalsValue: string,
): MatchResult | undefined {
    if (homeGoalsValue === "" || awayGoalsValue === "") return;

    const hg = Number(homeGoalsValue);
    const ag = Number(awayGoalsValue);

    if (!Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) {
        return;
    }

    return {
        homeGoals: hg,
        awayGoals: ag,
    };
}

/**
 * Wire the Save and Reset buttons to storage actions.
 * @param {LeaguePhase} fixtures - fixtures array to persist
 * @param {Function} onResultApplied - callback to invoke after reset/save actions
 * @return {void}
 */

let scrollToTopListener: (() => void) | null = null;

/**
 * Setup scroll-to-top button functionality
 * @return {void}
 */
export function setupScrollToTopButton(): void {
    const scrollButton: HTMLElement | null =
        document.getElementById("scroll-to-top");

    if (!scrollButton) return;

    // Show button when scrolled more than 1-2 screens (1000px or window height * 1.5)
    const scrollThreshold: number = Math.max(1000, window.innerHeight * 1.5);

    if (scrollToTopListener) {
        window.removeEventListener("scroll", scrollToTopListener);
    }

    scrollToTopListener = () => {
        if (window.scrollY > scrollThreshold) {
            scrollButton.classList.add("show");
        } else {
            scrollButton.classList.remove("show");
        }
    };

    window.addEventListener("scroll", scrollToTopListener);

    scrollButton.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupScrollToTopButton);
} else {
    setupScrollToTopButton();
}

/**
 * Subscribe to league selection changes
 * @param {Function} onChange - callback to invoke when league selection changes
 * @return {void}
 */
export function subscribeToLeagueChange(
    onChange: (league: string) => void,
): void {
    const selector = document.getElementById(
        "league-selector",
    ) as HTMLSelectElement;

    if (!selector) return;

    selector.addEventListener("change", (e) => {
        if (
            typeof onChange === "function" &&
            e.currentTarget instanceof HTMLSelectElement
        ) {
            onChange(e.currentTarget.value);
        }
    });
}

/**
 * Update the league selector dropdown to match the current selected league
 * @param {string} league - currently selected league
 * @return {void}
 */
export function updateLeagueSelector(league: string): void {
    const selector = document.getElementById(
        "league-selector",
    ) as HTMLSelectElement;

    if (selector) selector.value = league;
}
