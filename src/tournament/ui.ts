import type { Match, MatchUpdate } from "../interfaces/match.js";
import type { Round, KnockoutRound, LeagueRound } from "../interfaces/round.js";
import type { Table, TableRow } from "../interfaces/table.js";
import type {
    Phase,
    Stage,
    StandingsZone,
    StageHistoryEntry,
} from "../interfaces/tournament.js";
import { sortLeagueStageTable } from "./league-table.js";
import { groupLookup } from "../utils/groups.js";
import { createFormCell, createTeamCell } from "../team-detail.js";
import {
    createMatchdayActions,
    createSimulateAllBar,
    createSimulateRoundButton,
} from "../simulation-controls.js";

/**
 * Render a league-stage table in the #standings element.
 * Only meaningful during the league phase.
 */
export function renderLeagueTable(
    table: Table,
    visible: boolean,
    fixtures: LeagueRound[] = [],
    zones: StandingsZone[] = [],
) {
    const standingsSection: HTMLElement | null =
        document.querySelector(".standings-section");

    const tbody: HTMLElement | null =
        document.querySelector("#standings tbody");

    if (!tbody) return;

    // Knockout stages have no table
    if (!visible) {
        if (standingsSection) standingsSection.style.display = "none";
        return;
    }

    resetStandingsView();

    tbody.innerHTML = "";

    const sortedTable: TableRow[] = sortLeagueStageTable(table);

    sortedTable.forEach(function (row, i) {
        const tr: HTMLTableRowElement = document.createElement("tr");

        const zone = zones.find((z) => i < z.upTo);
        if (zone) tr.className = zone.status;

        const positionCell = document.createElement("td");
        positionCell.textContent = String(i + 1);
        tr.append(positionCell, createTeamCell(fixtures, row.team));

        const cells = [
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

        tr.appendChild(createFormCell(fixtures, row.team));

        tbody.appendChild(tr);
    });
}

/**
 * Show the single standings table and clear any group tables, e.g. when
 * leaving a competition or stage that used them.
 */
export function resetStandingsView(): void {
    const section = document.querySelector<HTMLElement>(".standings-section");
    const mainTable = document.getElementById("standings");
    const groupContainer = document.getElementById("group-standings");

    if (section) section.style.display = "";
    if (mainTable) mainTable.style.display = "";
    if (groupContainer) groupContainer.innerHTML = "";
}

const STANDINGS_HEADERS = ["#", "Team", "Played", "W", "D", "L", "GF", "GA", "GD", "Pts", "Form"];

function _standingsTable(headers: string[]): { table: HTMLTableElement; tbody: HTMLTableSectionElement } {
    const table = document.createElement("table");
    table.className = "standings-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach(function (header) {
        const th = document.createElement("th");
        th.textContent = header;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    const tbody = document.createElement("tbody");
    table.append(thead, tbody);
    return { table, tbody };
}

function _cell(value: string | number): HTMLTableCellElement {
    const td = document.createElement("td");
    td.textContent = String(value);
    return td;
}

/**
 * Render one table per group plus the ranking of third-placed teams.
 * Rows currently in a qualifying position are highlighted.
 */
export function renderGroupTables(
    tables: Record<string, TableRow[]>,
    thirds: { group: string; row: TableRow }[],
    qualifyingThirds: number,
    fixtures: Round[],
): void {
    const section = document.querySelector<HTMLElement>(".standings-section");
    const mainTable = document.getElementById("standings");
    const container = document.getElementById("group-standings");
    if (!container) return;

    if (section) section.style.display = "";
    if (mainTable) mainTable.style.display = "none";
    container.innerHTML = "";

    const qualifyingThirdTeams = new Set(
        thirds.slice(0, qualifyingThirds).map((t) => t.row.team),
    );

    Object.entries(tables).forEach(function ([letter, rows]) {
        const heading = document.createElement("h3");
        heading.textContent = "Group " + letter;

        const { table, tbody } = _standingsTable(STANDINGS_HEADERS);
        rows.forEach(function (row, i) {
            const tr = document.createElement("tr");
            if (i < 2 || (i === 2 && qualifyingThirdTeams.has(row.team))) {
                tr.className = "qualified";
            }
            tr.append(
                _cell(i + 1),
                createTeamCell(fixtures, row.team),
                _cell(row.played),
                _cell(row.wins),
                _cell(row.draws),
                _cell(row.losses),
                _cell(row.gf),
                _cell(row.ga),
                _cell(row.gf - row.ga),
                _cell(row.points),
                createFormCell(fixtures, row.team),
            );
            tbody.appendChild(tr);
        });

        container.append(heading, table);
    });

    if (qualifyingThirds > 0 && thirds.length > 0) {
        const heading = document.createElement("h3");
        heading.textContent = "Third-placed teams";

        const { table, tbody } = _standingsTable(["#", "Team", "Played", "W", "D", "L", "GF", "GA", "GD", "Pts"]);
        thirds.forEach(function ({ group, row }, i) {
            const tr = document.createElement("tr");
            tr.className = i < qualifyingThirds ? "qualified" : "contention";

            const teamCell = createTeamCell(fixtures, row.team);
            const tag = document.createElement("span");
            tag.className = "group-tag";
            tag.textContent = group;
            teamCell.appendChild(tag);

            tr.append(
                _cell(i + 1),
                teamCell,
                _cell(row.played),
                _cell(row.wins),
                _cell(row.draws),
                _cell(row.losses),
                _cell(row.gf),
                _cell(row.ga),
                _cell(row.gf - row.ga),
                _cell(row.points),
            );
            tbody.appendChild(tr);
        });

        const note = document.createElement("p");
        note.className = "standings-note";
        note.textContent =
            `Top two in each group and the best ${qualifyingThirds} third-placed teams reach the knockout stage.`;

        container.append(heading, table, note);
    }
}

/**
 * Parse a pair of goal-input strings and return validated integers.
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

function _hasCompletedScore(match: Match): boolean {
    return match.homeGoals !== null && match.awayGoals !== null;
}

function _hasDecisivePenalties(match: Match): boolean {
    return (
        typeof match.homePenalties === "number" &&
        typeof match.awayPenalties === "number" &&
        Number.isInteger(match.homePenalties) &&
        Number.isInteger(match.awayPenalties) &&
        match.homePenalties >= 0 &&
        match.awayPenalties >= 0 &&
        match.homePenalties !== match.awayPenalties
    );
}

function _isAggregateDraw(leg1: Match, leg2: Match): boolean {
    return (
        _hasCompletedScore(leg1) &&
        _hasCompletedScore(leg2) &&
        leg1.homeGoals! + leg2.awayGoals! ===
            leg1.awayGoals! + leg2.homeGoals!
    );
}

function _renderPenaltyShootout(
    container: HTMLElement,
    match: Match,
    idPrefix: string,
    onResultsApplied: (updates: MatchUpdate[]) => void,
    readOnly: boolean,
): void {
    const penaltyDiv = document.createElement("div");
    penaltyDiv.className = "penalty-shootout";

    const heading = document.createElement("strong");
    heading.textContent = "Penalty shootout: ";
    penaltyDiv.appendChild(heading);

    if (readOnly) {
        const result = document.createElement("span");
        if (_hasDecisivePenalties(match)) {
            const winner =
                match.homePenalties! > match.awayPenalties!
                    ? match.homeTeam
                    : match.awayTeam;
            result.textContent =
                match.homeTeam +
                " " +
                match.homePenalties +
                " - " +
                match.awayPenalties +
                " " +
                match.awayTeam +
                " — " +
                winner +
                " wins";
        } else {
            result.textContent = "TBD";
        }
        penaltyDiv.appendChild(result);
        container.appendChild(penaltyDiv);
        return;
    }

    const homeLabel = document.createElement("label");
    homeLabel.htmlFor = idPrefix + "_home_penalties";
    homeLabel.textContent = match.homeTeam;

    const homeInput = document.createElement("input");
    homeInput.type = "number";
    homeInput.id = idPrefix + "_home_penalties";
    homeInput.min = "0";
    homeInput.style.width = "48px";
    homeInput.value =
        match.homePenalties != null ? String(match.homePenalties) : "";

    const awayLabel = document.createElement("label");
    awayLabel.htmlFor = idPrefix + "_away_penalties";
    awayLabel.textContent = match.awayTeam;

    const awayInput = document.createElement("input");
    awayInput.type = "number";
    awayInput.id = idPrefix + "_away_penalties";
    awayInput.min = "0";
    awayInput.style.width = "48px";
    awayInput.value =
        match.awayPenalties != null ? String(match.awayPenalties) : "";

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.textContent = "Apply penalties";

    const validation = document.createElement("span");
    validation.className = "penalty-validation";
    validation.setAttribute("role", "alert");

    applyButton.addEventListener("click", function () {
        const parsed = _parseGoals(homeInput.value, awayInput.value);
        if (!parsed) {
            validation.textContent = "Enter valid penalty scores.";
            return;
        }
        if (parsed.homeGoals === parsed.awayGoals) {
            validation.textContent = "Penalty scores must produce a winner.";
            return;
        }

        const oldMatch: Match = { ...match };
        match.homePenalties = parsed.homeGoals;
        match.awayPenalties = parsed.awayGoals;
        onResultsApplied([{ match, oldMatch }]);
    });

    penaltyDiv.append(
        homeLabel,
        " ",
        homeInput,
        " - ",
        awayInput,
        " ",
        awayLabel,
        " ",
        applyButton,
        " ",
        validation,
    );
    container.appendChild(penaltyDiv);
}

/**
 * Render fixtures for the current stage.
 * During knockout phases it also shows aggregate scores per tie.
 */
export function renderStageFixtures(
    fixtures: Round[],
    onResultsApplied: (updates: MatchUpdate[]) => void,
    stage: Stage,
    bannerText: string,
    readOnly = false,
    onSimulate?: (roundIndices: number[]) => void,
) {
    const container: HTMLElement | null = document.getElementById("fixtures");
    if (!container) return;

    container.innerHTML = "";

    const banner: HTMLDivElement = document.createElement("div");
    banner.className = "phase-indicator";
    const strong = document.createElement("strong");
    strong.textContent = bannerText;
    banner.appendChild(strong);
    container.appendChild(banner);

    if (!readOnly && onSimulate) {
        container.appendChild(
            createSimulateAllBar(() => onSimulate(fixtures.map((_, i) => i))),
        );
    }

    const isTwoLegKnockout = stage.kind === "knockout" && stage.legs === 2;

    // For two-leg ties, wrap the callback so aggregate displays refresh
    let wrappedOnResultsApplied = onResultsApplied;

    if (isTwoLegKnockout) {
        wrappedOnResultsApplied = function (updates: MatchUpdate[]) {
            onResultsApplied(updates);
            _refreshAllAggregates(container, fixtures);
        };
    }

    fixtures.forEach(function (round: Round, i: number) {
        const div: HTMLDivElement = document.createElement("div");
        div.className = "matchday";

        const roundLabel: string =
            stage.kind === "knockout" ? stage.label : "Matchday " + (i + 1);

        const h3 = document.createElement("h3");
        h3.textContent = roundLabel;
        div.appendChild(h3);

        if (stage.kind === "league" || stage.kind === "groups") {
            const groupOf =
                stage.kind === "groups" ? groupLookup(stage.groups) : null;
            _renderLeagueRound(
                div,
                round as LeagueRound,
                i,
                wrappedOnResultsApplied,
                readOnly,
                groupOf ? (match) => "Group " + groupOf(match.homeTeam) : null,
            );
        } else if (stage.legs === 2) {
            _renderKnockoutRound(
                div,
                round as KnockoutRound,
                i,
                wrappedOnResultsApplied,
                readOnly,
            );
        } else {
            _renderSingleLegRound(
                div,
                round,
                i,
                wrappedOnResultsApplied,
                readOnly,
            );
        }

        if (!readOnly) {
            const applyAllResultsButton: HTMLButtonElement =
                document.createElement("button");

            applyAllResultsButton.className = "apply-all-btn";
            applyAllResultsButton.textContent = "Apply all results";

            applyAllResultsButton.addEventListener("click", function () {
                const updates: MatchUpdate[] = [];
                round.matches.forEach(function (match: Match, idx: number) {
                    const id: string = "r" + i + "_m" + idx;

                    const hgEl: HTMLInputElement | null = div.querySelector(
                        "#" + id + "_hg",
                    );
                    const agEl: HTMLInputElement | null = div.querySelector(
                        "#" + id + "_ag",
                    );

                    if (
                        !hgEl ||
                        !agEl ||
                        hgEl.value === "" ||
                        agEl.value === ""
                    ) {
                        return;
                    }

                    const parsedInput = _parseGoals(hgEl.value, agEl.value);

                    if (!parsedInput) return;

                    const oldMatch: Match = { ...match };

                    match.homeGoals = parsedInput.homeGoals;
                    match.awayGoals = parsedInput.awayGoals;

                    updates.push({ match, oldMatch });
                });

                if (updates.length === 0) return;

                wrappedOnResultsApplied(updates);
            });

            // Knockout phases are a single round, covered by the top bar
            const actionButtons =
                stage.kind !== "knockout" && onSimulate
                    ? [createSimulateRoundButton(() => onSimulate([i])), applyAllResultsButton]
                    : [applyAllResultsButton];

            div.appendChild(createMatchdayActions(...actionButtons));
        }

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
    onResultsApplied: (updates: MatchUpdate[]) => void,
    readOnly: boolean,
    labelOf: ((match: Match) => string) | null = null,
): void {
    round.matches.forEach(function (match: Match, idx: number) {
        const matchRow: HTMLDivElement = _createMatchRow(
            match,
            roundIdx,
            idx,
            onResultsApplied,
            labelOf ? labelOf(match) : null,
            readOnly,
        );

        container.appendChild(matchRow);
    });
}

/**
 * Render single-match ties; a drawn match gets a penalty shootout below it.
 */
function _renderSingleLegRound(
    container: HTMLDivElement,
    round: Round,
    roundIdx: number,
    onResultsApplied: (updates: MatchUpdate[]) => void,
    readOnly: boolean,
): void {
    round.matches.forEach(function (match: Match, idx: number) {
        container.appendChild(
            _createMatchRow(match, roundIdx, idx, onResultsApplied, null, readOnly),
        );

        if (_hasCompletedScore(match) && match.homeGoals === match.awayGoals) {
            _renderPenaltyShootout(
                container,
                match,
                "r" + roundIdx + "_m" + idx,
                onResultsApplied,
                readOnly,
            );
            // Sits directly under its match instead of after a divider
            container.lastElementChild?.classList.add("single-leg-shootout");
        }
    });
}

/**
 * Render a knockout round grouped into two-leg ties with aggregate display.
 */
function _renderKnockoutRound(
    container: HTMLDivElement,
    round: KnockoutRound,
    roundIdx: number,
    onResultsApplied: (updates: MatchUpdate[]) => void,
    readOnly: boolean,
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
            _createMatchRow(
                leg1,
                roundIdx,
                i,
                onResultsApplied,
                "Leg 1",
                readOnly,
            ),
        );

        tieDiv.appendChild(
            _createMatchRow(
                leg2,
                roundIdx,
                i + 1,
                onResultsApplied,
                "Leg 2",
                readOnly,
            ),
        );

        const aggregateDiv: HTMLDivElement = document.createElement("div");
        aggregateDiv.className = "aggregate-display";
        aggregateDiv.style.marginTop = "4px";
        aggregateDiv.style.fontStyle = "italic";
        _updateAggregate(aggregateDiv, leg1, leg2);
        tieDiv.appendChild(aggregateDiv);

        if (_isAggregateDraw(leg1, leg2)) {
            _renderPenaltyShootout(
                tieDiv,
                leg2,
                "r" + roundIdx + "_tie" + i / 2,
                onResultsApplied,
                readOnly,
            );
        }

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
    onResultsApplied: (updates: MatchUpdate[]) => void,
    label: string | null,
    readOnly: boolean,
): HTMLDivElement {
    const line: HTMLDivElement = document.createElement("div");
    line.className = "match";

    const id: string = "r" + roundIdx + "_m" + matchIdx;
    const labelText: string = label ? " (" + label + ")" : "";

    const homeSpan = document.createElement("span");
    homeSpan.textContent = match.homeTeam;

    const awaySpan = document.createElement("span");
    awaySpan.textContent = match.awayTeam;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = labelText;

    if (readOnly) {
        const score = document.createElement("strong");
        score.className = "match-score";
        score.textContent =
            match.homeGoals !== null && match.awayGoals !== null
                ? match.homeGoals + " - " + match.awayGoals
                : "TBD";
        line.append(homeSpan, " ", score, " ", awaySpan, labelSpan);
        return line;
    }

    const homeInput = document.createElement("input");
    homeInput.type = "number";
    homeInput.id = id + "_hg";
    homeInput.min = "0";
    homeInput.style.width = "40px";
    homeInput.value = match.homeGoals != null ? String(match.homeGoals) : "";

    const dash = document.createTextNode(" - ");

    const awayInput = document.createElement("input");
    awayInput.type = "number";
    awayInput.id = id + "_ag";
    awayInput.min = "0";
    awayInput.style.width = "40px";
    awayInput.value = match.awayGoals != null ? String(match.awayGoals) : "";

    const applyBtn = document.createElement("button");
    applyBtn.id = id + "_btn";
    applyBtn.textContent = "Apply result";

    line.append(
        homeSpan,
        " ",
        homeInput,
        dash,
        awayInput,
        " ",
        awaySpan,
        labelSpan,
        " ",
        applyBtn,
    );

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

        const oldMatch: Match = { ...match };

        match.homeGoals = parsedInputs.homeGoals;
        match.awayGoals = parsedInputs.awayGoals;
        onResultsApplied([{ match, oldMatch }]);
    });

    return line;
}

/**
 * Render a selector for completed phases without making historic results live.
 */
export function renderHistoryControls(
    history: StageHistoryEntry[],
    labelOf: (phase: Phase) => string,
    currentPhase: Phase,
    viewedHistoryPhase: Phase | null,
    onHistorySelect: (phase: Phase) => void,
    onReturnToCurrent: () => void,
): void {
    if (history.length === 0) return;

    const container: HTMLElement | null = document.getElementById("fixtures");
    if (!container) return;

    const controls = document.createElement("div");
    controls.className = "phase-history-controls";

    const label = document.createElement("label");
    label.htmlFor = "phase-history-selector";
    label.textContent = "View completed stage:";

    const selector = document.createElement("select");
    selector.id = "phase-history-selector";

    const currentOption = document.createElement("option");
    currentOption.value = "current";
    currentOption.textContent =
        "Current: " + labelOf(currentPhase);
    selector.appendChild(currentOption);

    history.forEach(function (entry) {
        const option = document.createElement("option");
        option.value = entry.phase;
        option.textContent = labelOf(entry.phase);
        selector.appendChild(option);
    });

    selector.value = viewedHistoryPhase || "current";
    selector.addEventListener("change", function () {
        if (selector.value === "current") {
            onReturnToCurrent();
            return;
        }
        onHistorySelect(selector.value as Phase);
    });

    controls.append(label, selector);

    if (viewedHistoryPhase) {
        const returnButton = document.createElement("button");
        returnButton.type = "button";
        returnButton.textContent = "Return to current stage";
        returnButton.addEventListener("click", onReturnToCurrent);
        controls.appendChild(returnButton);
    }

    container.prepend(controls);
}

/**
 * Update an aggregate-display element with computed totals.
 */
function _updateAggregate(
    element: HTMLElement,
    leg1: Match,
    leg2: Match,
): void {
    const l1Complete = _hasCompletedScore(leg1);
    const l2Complete = _hasCompletedScore(leg2);

    if (!l1Complete && !l2Complete) {
        element.textContent = "Aggregate: TBD";
        return;
    }

    const l1h = leg1.homeGoals || 0;
    const l1a = leg1.awayGoals || 0;
    const l2h = leg2.homeGoals || 0;
    const l2a = leg2.awayGoals || 0;

    const aggregate1: number = l1h + l2a;
    const aggregate2: number = l1a + l2h;

    element.textContent =
        "Aggregate: " +
        leg1.homeTeam +
        " " +
        aggregate1 +
        " – " +
        aggregate2 +
        " " +
        leg1.awayTeam;

    if (l1Complete && l2Complete) {
        if (aggregate1 > aggregate2) {
            element.textContent += " -> " + leg1.homeTeam + " advances";
        } else if (aggregate2 > aggregate1) {
            element.textContent += " -> " + leg1.awayTeam + " advances";
        } else {
            if (_hasDecisivePenalties(leg2)) {
                const winner =
                    leg2.homePenalties! > leg2.awayPenalties!
                        ? leg2.homeTeam
                        : leg2.awayTeam;
                element.textContent +=
                    " -> " + winner + " advances on penalties (" +
                    leg2.homePenalties + " - " + leg2.awayPenalties + ")";
            } else {
                element.textContent += " -> Penalties required";
            }
        }
    }
}

/**
 * Refresh all aggregate displays in the fixtures container.
 * Walks .aggregate-display elements in DOM order and pairs them
 * with two-leg ties from the fixtures array (matches alternate leg1, leg2).
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
