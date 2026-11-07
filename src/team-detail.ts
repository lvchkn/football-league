import type { Round } from "./interfaces/round.js";
import {
    getForm,
    getRecordsByOpponent,
    getSplits,
    getTeamResults,
    type SplitRecord,
    type TeamResult,
} from "./utils/team-stats.js";

const OUTCOME_LABELS = { W: "Win", D: "Draw", L: "Loss" } as const;

function _formBadge(result: TeamResult): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = `form-badge form-${result.outcome}`;
    badge.textContent = result.outcome;
    badge.title =
        `MD${result.matchday}: ${OUTCOME_LABELS[result.outcome]} ` +
        `${result.goalsFor}-${result.goalsAgainst} ` +
        `${result.venue === "H" ? "vs" : "at"} ${result.opponent}`;
    return badge;
}

/**
 * Standings cell showing the team's last five results (most recent rightmost).
 */
export function createFormCell(rounds: Round[], team: string): HTMLTableCellElement {
    const td = document.createElement("td");
    td.className = "form-cell";
    getForm(getTeamResults(rounds, team)).forEach(function (result) {
        td.appendChild(_formBadge(result));
    });
    return td;
}

/**
 * Standings cell with the team name as a button that opens its detail view.
 */
export function createTeamCell(rounds: Round[], team: string): HTMLTableCellElement {
    const td = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-link";
    button.textContent = team;
    button.addEventListener("click", function () {
        openTeamDetail(rounds, team);
    });
    td.appendChild(button);
    return td;
}

function _getDialog(): HTMLDialogElement {
    let dialog = document.getElementById("team-detail") as HTMLDialogElement | null;
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "team-detail";
    dialog.className = "team-detail";
    // Close when clicking the backdrop
    dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog!.close();
    });
    document.body.appendChild(dialog);
    return dialog;
}

function _table(headers: string[], rows: (string | number | Node)[][]): HTMLTableElement {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach(function (header) {
        const th = document.createElement("th");
        th.textContent = header;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(function (cells) {
        const tr = document.createElement("tr");
        cells.forEach(function (cell) {
            const td = document.createElement("td");
            if (cell instanceof Node) td.appendChild(cell);
            else td.textContent = String(cell);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
}

function _section(title: string, content: Node): HTMLElement {
    const section = document.createElement("section");
    const h3 = document.createElement("h3");
    h3.textContent = title;
    section.append(h3, content);
    return section;
}

function _splitRow(label: string, split: SplitRecord): (string | number)[] {
    return [
        label,
        split.played,
        split.wins,
        split.draws,
        split.losses,
        split.gf,
        split.ga,
        split.gf - split.ga,
        split.points,
    ];
}

function _emptyNote(text: string): HTMLParagraphElement {
    const p = document.createElement("p");
    p.className = "team-detail-empty";
    p.textContent = text;
    return p;
}

/**
 * Open a modal with the team's results, home/away splits and record per opponent.
 */
export function openTeamDetail(rounds: Round[], team: string): void {
    const dialog = _getDialog();
    dialog.innerHTML = "";

    const header = document.createElement("div");
    header.className = "team-detail-header";
    const h2 = document.createElement("h2");
    h2.textContent = team;
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "team-detail-close";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", function () {
        dialog.close();
    });
    header.append(h2, closeButton);
    dialog.appendChild(header);

    const results = getTeamResults(rounds, team);

    if (results.length === 0) {
        dialog.appendChild(_emptyNote("No results entered for this team yet."));
        dialog.showModal();
        return;
    }

    const { overall, home, away } = getSplits(results);
    dialog.appendChild(
        _section(
            "Record",
            _table(
                ["", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"],
                [_splitRow("Overall", overall), _splitRow("Home", home), _splitRow("Away", away)],
            ),
        ),
    );

    dialog.appendChild(
        _section(
            "Results",
            _table(
                ["MD", "", "Opponent", "Score", ""],
                results.map(function (result) {
                    return [
                        result.matchday,
                        result.venue,
                        result.opponent,
                        `${result.goalsFor}-${result.goalsAgainst}`,
                        _formBadge(result),
                    ];
                }),
            ),
        ),
    );

    dialog.appendChild(
        _section(
            "Head-to-head",
            _table(
                ["Opponent", "P", "W", "D", "L", "GF", "GA", "Meetings"],
                getRecordsByOpponent(results).map(function (record) {
                    const meetings = record.results
                        .map((r) => `${r.goalsFor}-${r.goalsAgainst} (${r.venue})`)
                        .join(", ");
                    return [
                        record.opponent,
                        record.played,
                        record.wins,
                        record.draws,
                        record.losses,
                        record.gf,
                        record.ga,
                        meetings,
                    ];
                }),
            ),
        ),
    );

    dialog.showModal();
}
