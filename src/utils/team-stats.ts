import type { Round } from "../interfaces/round.js";

export type Outcome = "W" | "D" | "L";
export type Venue = "H" | "A";

/**
 * A single played match seen from one team's perspective.
 */
export interface TeamResult {
    matchday: number; // 1-based
    opponent: string;
    venue: Venue;
    goalsFor: number;
    goalsAgainst: number;
    outcome: Outcome;
}

export interface SplitRecord {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    ga: number;
    points: number;
}

export interface OpponentRecord extends SplitRecord {
    opponent: string;
    results: TeamResult[];
}

function _outcome(goalsFor: number, goalsAgainst: number): Outcome {
    if (goalsFor > goalsAgainst) return "W";
    if (goalsFor < goalsAgainst) return "L";
    return "D";
}

function _emptySplit(): SplitRecord {
    return { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
}

function _addToSplit(split: SplitRecord, result: TeamResult): void {
    split.played++;
    split.gf += result.goalsFor;
    split.ga += result.goalsAgainst;

    if (result.outcome === "W") {
        split.wins++;
        split.points += 3;
    } else if (result.outcome === "D") {
        split.draws++;
        split.points += 1;
    } else {
        split.losses++;
    }
}

/**
 * Collect all played matches of a team, in matchday order.
 */
export function getTeamResults(rounds: Round[], team: string): TeamResult[] {
    const results: TeamResult[] = [];

    rounds.forEach(function (round, roundIndex) {
        round.matches.forEach(function (match) {
            const { homeTeam, awayTeam, homeGoals, awayGoals } = match;
            if (homeGoals == null || awayGoals == null) return;

            if (homeTeam === team) {
                results.push({
                    matchday: roundIndex + 1,
                    opponent: awayTeam,
                    venue: "H",
                    goalsFor: homeGoals,
                    goalsAgainst: awayGoals,
                    outcome: _outcome(homeGoals, awayGoals),
                });
            } else if (awayTeam === team) {
                results.push({
                    matchday: roundIndex + 1,
                    opponent: homeTeam,
                    venue: "A",
                    goalsFor: awayGoals,
                    goalsAgainst: homeGoals,
                    outcome: _outcome(awayGoals, homeGoals),
                });
            }
        });
    });

    return results;
}

/**
 * Last `count` outcomes, oldest first (so the most recent is rightmost).
 */
export function getForm(results: TeamResult[], count = 5): TeamResult[] {
    return results.slice(-count);
}

/**
 * Overall, home and away records.
 */
export function getSplits(results: TeamResult[]): {
    overall: SplitRecord;
    home: SplitRecord;
    away: SplitRecord;
} {
    const overall = _emptySplit();
    const home = _emptySplit();
    const away = _emptySplit();

    results.forEach(function (result) {
        _addToSplit(overall, result);
        _addToSplit(result.venue === "H" ? home : away, result);
    });

    return { overall, home, away };
}

/**
 * Record against each opponent faced, in order of first meeting.
 */
export function getRecordsByOpponent(results: TeamResult[]): OpponentRecord[] {
    const byOpponent = new Map<string, OpponentRecord>();

    results.forEach(function (result) {
        let record = byOpponent.get(result.opponent);
        if (!record) {
            record = { opponent: result.opponent, results: [], ..._emptySplit() };
            byOpponent.set(result.opponent, record);
        }
        _addToSplit(record, result);
        record.results.push(result);
    });

    return [...byOpponent.values()];
}
