import type { MatchUpdate } from "./interfaces/match.js";
import type { Round } from "./interfaces/round.js";

/**
 * Score inputs follow the id scheme `r{round}_m{match}_hg` / `_ag`
 * in both the domestic and UEFA fixture renderers.
 */
function _inputs(roundIndex: number, matchIndex: number) {
    const id = `r${roundIndex}_m${matchIndex}`;
    return {
        home: document.getElementById(`${id}_hg`) as HTMLInputElement | null,
        away: document.getElementById(`${id}_ag`) as HTMLInputElement | null,
    };
}

function _parseGoal(value: string): number | null {
    if (value === "") return null;
    const goals = Number(value);
    return Number.isInteger(goals) && goals >= 0 ? goals : null;
}

/**
 * Commit scores the user typed but didn't apply yet, so a simulation keeps
 * them rather than overwriting them. Mutates matches; returns their updates.
 */
export function collectTypedResults(rounds: Round[], roundIndices: number[]): MatchUpdate[] {
    const updates: MatchUpdate[] = [];

    roundIndices.forEach(function (roundIndex) {
        rounds[roundIndex]?.matches.forEach(function (match, matchIndex) {
            const { home, away } = _inputs(roundIndex, matchIndex);
            if (!home || !away) return;

            const homeGoals = _parseGoal(home.value);
            const awayGoals = _parseGoal(away.value);
            if (homeGoals === null || awayGoals === null) return;
            if (homeGoals === match.homeGoals && awayGoals === match.awayGoals) return;

            const oldMatch = { ...match };
            match.homeGoals = homeGoals;
            match.awayGoals = awayGoals;
            updates.push({ match, oldMatch });
        });
    });

    return updates;
}

/**
 * Write the stored scores of the given rounds back into their inputs.
 */
export function syncScoreInputs(rounds: Round[], roundIndices: number[]): void {
    roundIndices.forEach(function (roundIndex) {
        rounds[roundIndex]?.matches.forEach(function (match, matchIndex) {
            const { home, away } = _inputs(roundIndex, matchIndex);
            if (home) home.value = match.homeGoals != null ? String(match.homeGoals) : "";
            if (away) away.value = match.awayGoals != null ? String(match.awayGoals) : "";
        });
    });
}

/**
 * Bar with a "Simulate remaining matches" button, shown above the fixtures.
 */
export function createSimulateAllBar(onClick: () => void): HTMLDivElement {
    const bar = document.createElement("div");
    bar.className = "simulate-bar";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "simulate-btn";
    button.textContent = "Simulate remaining matches";
    button.title = "Fill every match without a result with a random score";
    button.addEventListener("click", onClick);

    bar.appendChild(button);
    return bar;
}

/**
 * "Simulate matchday" button for a single round.
 */
export function createSimulateRoundButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "simulate-btn";
    button.textContent = "Simulate matchday";
    button.title = "Fill the matches without a result with a random score";
    button.addEventListener("click", onClick);
    return button;
}

/**
 * Wrap a matchday's bottom buttons in a centred row.
 */
export function createMatchdayActions(...buttons: HTMLButtonElement[]): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "matchday-actions";
    row.append(...buttons);
    return row;
}
