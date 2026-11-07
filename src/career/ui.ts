import type { Teams } from "../interfaces/tournament.js";
import { DOMESTIC_LEAGUES, TOURNAMENTS } from "../competitions.js";
import { CLUB_COMPETITIONS } from "./europe.js";
import { seasonLabel, type CareerState, type SeasonSummary } from "./state.js";

export interface CareerBarHandlers {
    onEndSeason(): void;
    onShowHistory(): void;
    onReset(): void;
}

/**
 * Show the season bar in Career mode (hide it in Classic).
 */
export function renderCareerBar(state: CareerState | null, handlers: CareerBarHandlers): void {
    const bar = document.getElementById("career-bar");
    if (!bar) return;

    bar.hidden = !state;
    bar.replaceChildren();
    if (!state) return;

    const label = document.createElement("span");
    label.className = "career-season";
    label.textContent = `Season ${seasonLabel(state.season)}`;

    const endButton = _button("End season", "end-season-btn", handlers.onEndSeason);
    const historyButton = _button("Past seasons", "career-history-btn", handlers.onShowHistory);
    historyButton.disabled = state.history.length === 0;
    const resetButton = _button("Reset career", "reset-career-btn", handlers.onReset);

    bar.append(label, endButton, historyButton, resetButton);
}

/**
 * Highlight the active mode in the Classic | Career switch.
 */
export function setupModeSwitch(current: string, onChange: (mode: string) => void): void {
    document.querySelectorAll<HTMLButtonElement>(".mode-switch button").forEach(function (button) {
        const mode = button.dataset["mode"];
        button.setAttribute("aria-pressed", String(mode === current));
        button.onclick = function () {
            if (mode && mode !== current) onChange(mode);
        };
    });
}

export function openSeasonSummary(summary: SeasonSummary): void {
    const dialog = _dialog(`Season ${seasonLabel(summary.season)} review`);

    const rows = summary.leagues.map((league) => [
        DOMESTIC_LEAGUES[league.league].name,
        league.champion,
        _list(league.promoted),
        _list(league.relegated),
    ]);
    dialog.appendChild(_section("Domestic leagues", _table(["League", "Champion", "Promoted", "Relegated"], rows)));

    const playoffs = summary.leagues.filter((league) => league.playoff);
    if (playoffs.length) {
        const list = document.createElement("ul");
        playoffs.forEach(function ({ league, playoff }) {
            const item = document.createElement("li");
            const stays = playoff!.winner === playoff!.topTeam;
            item.textContent = `${DOMESTIC_LEAGUES[league].name}: ${playoff!.score}. ${playoff!.winner} ${stays ? "stay up" : "go up"}.`;
            list.appendChild(item);
        });
        dialog.appendChild(_section("Relegation play-offs", list));
    }

    const winners = CLUB_COMPETITIONS.filter((c) => summary.uefaWinners[c]).map((c) => [
        TOURNAMENTS[c].name,
        summary.uefaWinners[c]!,
    ]);
    if (winners.length) {
        dialog.appendChild(_section("European winners", _table(["Competition", "Winner"], winners)));
    }

    const qualified = CLUB_COMPETITIONS.map((c) => [TOURNAMENTS[c].name, _list(summary.qualified[c])]);
    dialog.appendChild(
        _section(
            `Qualified for ${seasonLabel(summary.season + 1)}`,
            _table(["Competition", "Clubs from the app's leagues"], qualified),
        ),
    );

    dialog.showModal();
}

export function openCareerHistory(history: SeasonSummary[]): void {
    const dialog = _dialog("Past seasons");
    const list = document.createElement("ul");
    list.className = "career-history";
    [...history].reverse().forEach(function (summary) {
        const item = document.createElement("li");
        const champions = summary.leagues
            .filter((l) => ["english", "spanish", "italian", "german", "french"].includes(l.league))
            .map((l) => l.champion)
            .join(", ");
        const link = _button(seasonLabel(summary.season), "", () => openSeasonSummary(summary));
        link.className = "team-link";
        item.append(link, document.createTextNode(` · champions: ${champions}`));
        list.appendChild(item);
    });
    dialog.appendChild(list);
    dialog.showModal();
}

function _list(teams?: Teams): string {
    return teams?.length ? teams.join(", ") : "–";
}

function _button(text: string, id: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    if (id) button.id = id;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
}

function _dialog(title: string): HTMLDialogElement {
    let dialog = document.getElementById("career-dialog") as HTMLDialogElement | null;
    if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "career-dialog";
        dialog.className = "team-detail career-dialog";
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) dialog!.close();
        });
        document.body.appendChild(dialog);
    }
    if (dialog.open) dialog.close();
    dialog.replaceChildren();

    const header = document.createElement("div");
    header.className = "team-detail-header";
    const h2 = document.createElement("h2");
    h2.textContent = title;
    const close = _button("×", "", () => dialog!.close());
    close.className = "team-detail-close";
    close.setAttribute("aria-label", "Close");
    header.append(h2, close);
    dialog.appendChild(header);
    return dialog;
}

function _section(title: string, content: Node): HTMLElement {
    const section = document.createElement("section");
    const h3 = document.createElement("h3");
    h3.textContent = title;
    section.append(h3, content);
    return section;
}

function _table(headers: string[], rows: string[][]): HTMLTableElement {
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    headers.forEach(function (text) {
        const th = document.createElement("th");
        th.textContent = text;
        head.appendChild(th);
    });
    const body = table.createTBody();
    rows.forEach(function (cells) {
        const row = body.insertRow();
        cells.forEach((text) => (row.insertCell().textContent = text));
    });
    return table;
}
