import type {
    KnockoutRound,
    LeagueRound,
    Match,
    Phase,
    Round,
} from "./fixtures.js";
import { sortUEFATable, type Table, type TableRow } from "./table.js";

/**
 * Human-readable label for each UEFA phase.
 */
const PHASE_LABELS: Record<Phase, string> = {
    league: "League Phase",
    playoffs: "Knockout Playoffs",
    r16: "Round of 16",
    quarterfinals: "Quarter-finals",
    semifinals: "Semi-finals",
    final: "Final",
    finished: "Finished",
};

/**
 * Render the UEFA league table in the #standings element.
 * Only meaningful during the league phase.
 * @param {Table} table
 * @param {Phase} phase
 */
export function renderUEFATable(table: Table, phase: Phase) {
    const standingsSection: HTMLElement | null =
        document.querySelector(".standings-section");

    const tbody: HTMLElement | null =
        document.querySelector("#standings tbody");

    if (!tbody) return;

    // During knockout phases, hide the league table and show a summary instead
    if (phase !== "league") {
        if (standingsSection) standingsSection.style.display = "none";
        return;
    }

    if (standingsSection) {
        standingsSection.style.display = "";
    }

    tbody.innerHTML = "";

    const sortedTable: TableRow[] = sortUEFATable(table);

    sortedTable.forEach(function (row, i) {
        const tr: HTMLTableRowElement = document.createElement("tr");

        // Colour-code qualifying positions
        if (i < 8) {
            tr.style.backgroundColor = "rgba(0,180,80,0.12)"; // top 8 — auto R16
        } else if (i < 24) {
            tr.style.backgroundColor = "rgba(255,165,0,0.10)"; // 9-24 — playoffs
        }

        tr.innerHTML =
            "<td>" +
            (i + 1) +
            "</td>" +
            "<td>" +
            row.team +
            "</td>" +
            "<td>" +
            row.played +
            "</td>" +
            "<td>" +
            row.wins +
            "</td>" +
            "<td>" +
            row.draws +
            "</td>" +
            "<td>" +
            row.losses +
            "</td>" +
            "<td>" +
            row.gf +
            "</td>" +
            "<td>" +
            row.ga +
            "</td>" +
            "<td>" +
            (row.gf - row.ga) +
            "</td>" +
            "<td>" +
            row.points +
            "</td>";

        tbody.appendChild(tr);
    });
}

/**
 * Parse a pair of goal-input strings and return validated integers.
 * @return {{ homeGoals: number, awayGoals: number } | null}
 */
function _parseGoals(
    homeGoals: string,
    awayGoals: string,
): { homeGoals: number; awayGoals: number } | null {
    const hg: number = parseInt(homeGoals, 10);
    const ag: number = parseInt(awayGoals, 10);

    if (!Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) {
        return null;
    }

    return { homeGoals: hg, awayGoals: ag };
}

/**
 * Render UEFA fixtures for the current phase.
 * During knockout phases it also shows aggregate scores per tie.
 * @param {Round[]} fixtures
 * @param {Function} onResultApplied
 * @param {Phase} phase
 */
export function renderUEFAFixtures(
    fixtures: Round[],
    onResultApplied: () => void,
    phase: Phase,
) {
    phase = phase || "league";
    const container: HTMLElement | null = document.getElementById("fixtures");
    if (!container) return;

    container.innerHTML = "";

    const banner: HTMLDivElement = document.createElement("div");
    banner.className = "phase-indicator";
    banner.innerHTML =
        "<strong>Current Phase: " +
        (PHASE_LABELS[phase] || phase) +
        "</strong>";
    container.appendChild(banner);

    const isKnockout: boolean = phase !== "league";

    // For knockout phases, wrap the callback so aggregate displays refresh
    let wrappedOnResultApplied = onResultApplied;

    if (isKnockout && phase !== "final") {
        wrappedOnResultApplied = function () {
            onResultApplied();
            _refreshAllAggregates(container, fixtures);
        };
    }

    fixtures.forEach(function (round: Round, i: number) {
        const div: HTMLDivElement = document.createElement("div");
        div.className = "matchday";

        let roundLabel: string;

        if (phase === "league") {
            roundLabel = "Matchday " + (i + 1);
        } else {
            roundLabel = PHASE_LABELS[phase] || "Round " + (i + 1);
        }

        div.innerHTML = "<h3>" + roundLabel + "</h3>";

        if (isKnockout && phase !== "final") {
            _renderKnockoutRound(
                div,
                round as KnockoutRound,
                i,
                wrappedOnResultApplied,
            );
        } else {
            _renderLeagueRound(
                div,
                round as LeagueRound,
                i,
                wrappedOnResultApplied,
            );
        }

        const applyAllResultsButton: HTMLButtonElement =
            document.createElement("button");

        applyAllResultsButton.className = "apply-all-btn";
        applyAllResultsButton.textContent = "Apply all results";

        applyAllResultsButton.addEventListener("click", function () {
            round.matches.forEach(function (match: Match, idx: number) {
                const id: string = "r" + i + "_m" + idx;

                const hgEl: HTMLInputElement | null = div.querySelector(
                    "#" + id + "_hg",
                );
                const agEl: HTMLInputElement | null = div.querySelector(
                    "#" + id + "_ag",
                );

                if (!hgEl || !agEl || hgEl.value === "" || agEl.value === "") {
                    return;
                }

                const parsedInput = _parseGoals(hgEl.value, agEl.value);

                if (!parsedInput) return;

                match.homeGoals = parsedInput.homeGoals;
                match.awayGoals = parsedInput.awayGoals;
            });

            wrappedOnResultApplied();
        });

        div.appendChild(applyAllResultsButton);

        container.appendChild(div);
    });
}

/**
 * Render a set of league-phase matches (no ties, no aggregates).
 */
function _renderLeagueRound(
    container: HTMLDivElement,
    round: LeagueRound,
    roundIdx: number,
    onResultApplied: () => void,
): void {
    round.matches.forEach(function (match: Match, idx: number) {
        const matchRow: HTMLDivElement = _createMatchRow(
            match,
            roundIdx,
            idx,
            onResultApplied,
            null,
        );

        container.appendChild(matchRow);
    });
}

/**
 * Render a knockout round grouped into two-leg ties with aggregate display.
 */
function _renderKnockoutRound(
    container: HTMLDivElement,
    round: KnockoutRound,
    roundIdx: number,
    onResultApplied: () => void,
): void {
    for (let i = 0; i < round.matches.length; i += 2) {
        const leg1: Match = round.matches[i];
        const leg2: Match = round.matches[i + 1];

        const tieDiv: HTMLDivElement = document.createElement("div");
        tieDiv.className = "knockout-tie";
        tieDiv.style.marginBottom = "16px";
        tieDiv.style.padding = "8px";
        tieDiv.style.border = "1px solid #ccc";
        tieDiv.style.borderRadius = "6px";

        const header: HTMLDivElement = document.createElement("div");
        header.style.fontWeight = "bold";
        header.style.marginBottom = "6px";
        header.textContent = leg1.homeTeam + " vs " + leg1.awayTeam;
        tieDiv.appendChild(header);

        tieDiv.appendChild(
            _createMatchRow(leg1, roundIdx, i, onResultApplied, "Leg 1"),
        );

        tieDiv.appendChild(
            _createMatchRow(leg2, roundIdx, i + 1, onResultApplied, "Leg 2"),
        );

        const aggregateDiv: HTMLDivElement = document.createElement("div");
        aggregateDiv.className = "aggregate-display";
        aggregateDiv.style.marginTop = "4px";
        aggregateDiv.style.fontStyle = "italic";
        _updateAggregate(aggregateDiv, leg1, leg2);
        tieDiv.appendChild(aggregateDiv);

        container.appendChild(tieDiv);
    }
}

/**
 * Build a single match input row.
 */
function _createMatchRow(
    match: Match,
    roundIdx: number,
    matchIdx: number,
    onResultApplied: () => void,
    label: string | null,
): HTMLDivElement {
    const line: HTMLDivElement = document.createElement("div");
    line.className = "match";

    const id: string = "r" + roundIdx + "_m" + matchIdx;
    const labelText: string = label ? " (" + label + ")" : "";

    line.innerHTML =
        match.homeTeam +
        ' <input type="number" id="' +
        id +
        '_hg" min="0" style="width:40px" value="' +
        (match.homeGoals != null ? match.homeGoals : "") +
        '">' +
        " - " +
        '<input type="number" id="' +
        id +
        '_ag" min="0" style="width:40px" value="' +
        (match.awayGoals != null ? match.awayGoals : "") +
        '"> ' +
        match.awayTeam +
        labelText +
        ' <button id="' +
        id +
        '_btn">Apply result</button>';

    const applyButton: HTMLButtonElement | null = line.querySelector(
        "#" + id + "_btn",
    );

    applyButton?.addEventListener("click", function () {
        const hgInput: HTMLInputElement | null = line.querySelector(
            "#" + id + "_hg",
        );
        const agInput: HTMLInputElement | null = line.querySelector(
            "#" + id + "_ag",
        );

        if (!hgInput || !agInput) return;

        const hgValue: string = hgInput.value;
        const agValue: string = agInput.value;

        if (hgValue === "" || agValue === "") return;

        const parsedInputs = _parseGoals(hgValue, agValue);

        if (!parsedInputs) return;

        match.homeGoals = parsedInputs.homeGoals;
        match.awayGoals = parsedInputs.awayGoals;
        onResultApplied();
    });

    return line;
}

/**
 * Update an aggregate-display element with computed totals.
 */
function _updateAggregate(
    element: HTMLElement,
    leg1: Match,
    leg2: Match,
): void {
    if (
        leg1.homeGoals === null ||
        leg1.awayGoals === null ||
        leg2.homeGoals === null ||
        leg2.awayGoals === null
    ) {
        element.textContent = "Aggregate: TBD";
        return;
    }

    const aggregate1: number = leg1.homeGoals + leg2.awayGoals;
    const aggregate2: number = leg1.awayGoals + leg2.homeGoals;

    element.textContent =
        "Aggregate: " +
        leg1.homeTeam +
        " " +
        aggregate1 +
        " – " +
        aggregate2 +
        " " +
        leg1.awayTeam;

    if (aggregate1 > aggregate2) {
        element.textContent += " → " + leg1.homeTeam + " advances";
    } else if (aggregate2 > aggregate1) {
        element.textContent += " → " + leg1.awayTeam + " advances";
    } else {
        element.textContent +=
            " -> " + leg1.homeTeam + " advances (higher seed)";
    }
}

/**
 * Refresh all aggregate displays in the fixtures container.
 * Walks .aggregate-display elements in DOM order and pairs them
 * with two-leg ties from the fixtures array (matches alternate leg1, leg2).
 * @param {HTMLElement} container
 * @param {Array<Array<Object>>} fixtures
 */
function _refreshAllAggregates(
    container: HTMLElement,
    fixtures: Round[],
): void {
    const aggDivs: NodeListOf<HTMLElement> =
        container.querySelectorAll(".aggregate-display");

    const matches: Match[] = fixtures
        .map(function (round: Round) {
            return round.matches;
        })
        .flat();

    let tieIdx = 0;

    for (let i = 0; i < matches.length; i += 2) {
        if (aggDivs[tieIdx]) {
            _updateAggregate(aggDivs[tieIdx], matches[i], matches[i + 1]);
        }
        tieIdx++;
    }
}

/**
 * Render the "Progress to Next Phase" button.
 * @param {Function} onProgressClick
 */
export function renderPhaseProgressionButtons(
    onProgressClick: () => void,
): void {
    const container: HTMLElement | null = document.getElementById("fixtures");
    if (!container) return;

    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.className = "phase-buttons";
    wrapper.style.marginTop = "20px";

    const button: HTMLButtonElement = document.createElement("button");
    button.id = "progress-phase-btn";
    button.textContent = "Progress to Next Phase";
    button.addEventListener("click", onProgressClick);

    wrapper.appendChild(button);
    container.appendChild(wrapper);
}
