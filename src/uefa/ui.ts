import type { Match, MatchUpdate } from "../interfaces/match.js";
import type { Round, KnockoutRound, LeagueRound } from "../interfaces/round.js";
import type { Table, TableRow } from "../interfaces/table.js";
import type { Phase, UEFAHistoryEntry } from "../interfaces/tournament.js";
import { sortUEFATable } from "./table.js";

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
 * Render UEFA fixtures for the current phase.
 * During knockout phases it also shows aggregate scores per tie.
 */
export function renderUEFAFixtures(
    fixtures: Round[],
    onResultsApplied: (updates: MatchUpdate[]) => void,
    phase: Phase,
    readOnly = false,
) {
    phase = phase || "league";
    const container: HTMLElement | null = document.getElementById("fixtures");
    if (!container) return;

    container.innerHTML = "";

    const banner: HTMLDivElement = document.createElement("div");
    banner.className = "phase-indicator";
    const strong = document.createElement("strong");
    strong.textContent =
        (readOnly ? "Viewing completed phase: " : "Current Phase: ") +
        (PHASE_LABELS[phase] || phase);
    banner.appendChild(strong);
    container.appendChild(banner);

    const isKnockout: boolean = phase !== "league";

    // For knockout phases, wrap the callback so aggregate displays refresh
    let wrappedOnResultsApplied = onResultsApplied;

    if (isKnockout && phase !== "final" && phase !== "finished") {
        wrappedOnResultsApplied = function (updates: MatchUpdate[]) {
            onResultsApplied(updates);
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

        const h3 = document.createElement("h3");
        h3.textContent = roundLabel;
        div.appendChild(h3);

        if (isKnockout && phase !== "final" && phase !== "finished") {
            _renderKnockoutRound(
                div,
                round as KnockoutRound,
                i,
                wrappedOnResultsApplied,
                readOnly,
            );
        } else {
            _renderLeagueRound(
                div,
                round as LeagueRound,
                i,
                wrappedOnResultsApplied,
                readOnly,
            );
        }

        if (
            (phase === "final" || phase === "finished") &&
            round.matches[0] &&
            _hasCompletedScore(round.matches[0]) &&
            round.matches[0].homeGoals === round.matches[0].awayGoals
        ) {
            _renderPenaltyShootout(
                div,
                round.matches[0],
                "r" + i + "_final",
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

            div.appendChild(applyAllResultsButton);
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
): void {
    round.matches.forEach(function (match: Match, idx: number) {
        const matchRow: HTMLDivElement = _createMatchRow(
            match,
            roundIdx,
            idx,
            onResultsApplied,
            null,
            readOnly,
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
export function renderUEFAHistoryControls(
    history: UEFAHistoryEntry[],
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
        "Current: " + (PHASE_LABELS[currentPhase] || currentPhase);
    selector.appendChild(currentOption);

    history.forEach(function (entry) {
        const option = document.createElement("option");
        option.value = entry.phase;
        option.textContent = PHASE_LABELS[entry.phase] || entry.phase;
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
