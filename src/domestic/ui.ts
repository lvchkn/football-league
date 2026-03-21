import type {
    LeagueMatch,
    MatchResult,
    MatchUpdate,
} from "../interfaces/match.js";
import type { LeaguePhase, LeagueRound } from "../interfaces/round.js";
import type { Table, TableRow } from "../interfaces/table.js";
import { sortTable } from "./table.js";

/**
 * Render the league table in the HTML
 */
export function renderTable(table: Table): void {
    const tbody: HTMLElement | null =
        document.querySelector("#standings tbody");

    if (!tbody) return;

    tbody.innerHTML = "";

    const sortedTableRows: TableRow[] = sortTable(table);

    sortedTableRows.forEach((row, i) => {
        const tr: HTMLTableRowElement = document.createElement("tr");

        const cells = [
            i + 1,
            row.team,
            row.played,
            row.wins,
            row.draws,
            row.losses,
            row.gf,
            row.ga,
            row.gf - row.ga,
            row.points,
        ];

        cells.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = String(value);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

/**
 * Render the fixtures in the HTML
 */
export function renderFixtures(
    fixtures: LeaguePhase,
    onResultsApplied: (updates: MatchUpdate[]) => void,
): void {
    const container: HTMLElement | null = document.getElementById("fixtures");

    if (!container) return;

    container.innerHTML = "";

    fixtures.forEach((round: LeagueRound, i: number) => {
        const div: HTMLDivElement = document.createElement("div");
        div.className = "matchday";
        const h3: HTMLHeadingElement = document.createElement("h3");
        h3.textContent = `Matchday ${i + 1}`;
        div.appendChild(h3);

        round.matches.forEach((match: LeagueMatch, idx: number) => {
            const line: HTMLDivElement = document.createElement("div");
            line.className = "match";

            const id = `r${i}_m${idx}`;

            const homeSpan = document.createElement("span");
            homeSpan.textContent = match.homeTeam;

            const homeInput = document.createElement("input");
            homeInput.type = "number";
            homeInput.id = `${id}_hg`;
            homeInput.min = "0";
            homeInput.style.width = "40px";
            homeInput.value =
                match.homeGoals != null ? String(match.homeGoals) : "";

            const dash = document.createTextNode(" - ");

            const awayInput = document.createElement("input");
            awayInput.type = "number";
            awayInput.id = `${id}_ag`;
            awayInput.min = "0";
            awayInput.style.width = "40px";
            awayInput.value =
                match.awayGoals != null ? String(match.awayGoals) : "";

            const awaySpan = document.createElement("span");
            awaySpan.textContent = match.awayTeam;

            const applyBtn = document.createElement("button");
            applyBtn.id = `${id}_btn`;
            applyBtn.textContent = "Apply result";

            line.append(
                homeSpan,
                " ",
                homeInput,
                dash,
                awayInput,
                " ",
                awaySpan,
                " ",
                applyBtn,
            );

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

                const oldMatch: LeagueMatch = { ...match };

                const { homeGoals, awayGoals } = parsedInput;
                match.homeGoals = homeGoals;
                match.awayGoals = awayGoals;

                onResultsApplied([{ match, oldMatch }]);
            });

            div.appendChild(line);
        });

        const applyAllResultsButton: HTMLButtonElement =
            document.createElement("button");
        applyAllResultsButton.className = "apply-all-btn";
        applyAllResultsButton.textContent = "Apply all results";

        applyAllResultsButton.addEventListener("click", () => {
            const updates: MatchUpdate[] = [];
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

                const oldMatch: LeagueMatch = { ...match };

                const { homeGoals, awayGoals } = parsedInput;
                match.homeGoals = homeGoals;
                match.awayGoals = awayGoals;

                updates.push({ match, oldMatch });
            });

            if (updates.length === 0) return;

            onResultsApplied(updates);
        });

        div.appendChild(applyAllResultsButton);

        container.appendChild(div);
    });
}

/**
 * Get home and away goals from input values, with validation
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
