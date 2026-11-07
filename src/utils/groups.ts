import type { LeagueMatch } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";
import type { TableRow } from "../interfaces/table.js";
import type { Teams } from "../interfaces/tournament.js";
import { applyMatchResult, initTable, sortTable } from "../domestic/table.js";
import { shuffleArray } from "./shuffle.js";

/**
 * Single round-robin order for a four-team group, by draw position,
 * as used at the Euro and World Cup: 1v2 3v4, 1v3 2v4, 4v1 2v3.
 */
const FOUR_TEAM_SCHEDULE: [number, number][][] = [
    [
        [0, 1],
        [2, 3],
    ],
    [
        [0, 2],
        [1, 3],
    ],
    [
        [3, 0],
        [1, 2],
    ],
];

/**
 * Group-stage fixtures: one round per matchday, holding that matchday's
 * matches for every group in letter order.
 */
export function generateGroupFixtures(groups: Record<string, Teams>): Round[] {
    const letters = Object.keys(groups).sort();

    letters.forEach(function (letter) {
        if (groups[letter]!.length !== 4) {
            throw new Error(`Group ${letter} must have exactly 4 teams`);
        }
    });

    return FOUR_TEAM_SCHEDULE.map(function (pairs) {
        const matches: LeagueMatch[] = letters.flatMap((letter) =>
            pairs.map(([home, away]) => ({
                homeTeam: groups[letter]![home]!,
                awayTeam: groups[letter]![away]!,
                homeGoals: null,
                awayGoals: null,
            })),
        );
        return { matches };
    });
}

/**
 * Look up which group a team is in.
 */
export function groupLookup(groups: Record<string, Teams>): (team: string) => string | undefined {
    const byTeam = new Map<string, string>();
    Object.entries(groups).forEach(([letter, teams]) =>
        teams.forEach((team) => byTeam.set(team, letter)),
    );
    return (team) => byTeam.get(team);
}

/**
 * Sorted table per group. Ties are broken head-to-head first (points,
 * goal difference, goals among the tied teams), then overall goal
 * difference and goals, as in the Euro regulations.
 */
export function computeGroupTables(
    groups: Record<string, Teams>,
    rounds: Round[],
): Record<string, TableRow[]> {
    const groupOf = groupLookup(groups);
    const tables = Object.fromEntries(
        Object.entries(groups).map(([letter, teams]) => [letter, initTable(teams)]),
    );

    rounds.forEach((round) =>
        round.matches.forEach(function (match) {
            const letter = groupOf(match.homeTeam);
            if (letter && letter === groupOf(match.awayTeam)) {
                applyMatchResult(match, tables[letter]!);
            }
        }),
    );

    return Object.fromEntries(
        Object.keys(groups)
            .sort()
            .map((letter) => [letter, sortTable(tables[letter]!)]),
    );
}

export interface RankedThird {
    group: string;
    row: TableRow;
}

/**
 * Rank the third-placed teams across groups: points, goal difference,
 * goals scored, wins. Remaining ties fall back to group letter, standing
 * in for the disciplinary and coefficient criteria the app doesn't track.
 */
export function rankThirdPlaced(tables: Record<string, TableRow[]>): RankedThird[] {
    return Object.entries(tables)
        .filter(([, rows]) => rows[2])
        .map(([group, rows]) => ({ group, row: rows[2]! }))
        .sort(function (a, b) {
            const x = a.row;
            const y = b.row;
            return (
                y.points - x.points ||
                y.gf - y.ga - (x.gf - x.ga) ||
                y.gf - x.gf ||
                y.wins - x.wins ||
                a.group.localeCompare(b.group)
            );
        });
}

/**
 * Pair consecutive teams: [a, b, c, d] -> a v b, c v d. Used when the
 * previous round's winners are already in bracket order.
 */
export function pairAdjacent(teams: Teams): { homeTeam: string; awayTeam: string }[] {
    const pairings = [];
    for (let i = 0; i + 1 < teams.length; i += 2) {
        pairings.push({ homeTeam: teams[i]!, awayTeam: teams[i + 1]! });
    }
    return pairings;
}

export interface FixedDrawSlot {
    team: string;
    group: string;
    /** 0-based draw position within the group. */
    position: number;
}

/**
 * Draw groups from seeding pots: each group gets one team from every pot,
 * then positions within each group are drawn, which sets the fixture order.
 * Fixed slots (e.g. the host in A1) are honoured first.
 */
export function drawGroups(
    pots: Teams[],
    letters: string[],
    fixed: FixedDrawSlot[] = [],
    rng: () => number = Math.random,
): Record<string, Teams> {
    pots.forEach(function (pot, i) {
        if (pot.length !== letters.length) {
            throw new Error(`Pot ${i + 1} has ${pot.length} teams for ${letters.length} groups`);
        }
    });

    const fixedByTeam = new Map(fixed.map((slot) => [slot.team, slot]));
    const members: Record<string, Teams> = Object.fromEntries(letters.map((l) => [l, []]));

    pots.forEach(function (pot) {
        const openGroups = letters.filter(
            (letter) => !pot.some((team) => fixedByTeam.get(team)?.group === letter),
        );
        const drawn = shuffleArray(pot.filter((team) => !fixedByTeam.has(team)), rng);

        pot.forEach(function (team) {
            const slot = fixedByTeam.get(team);
            if (slot) members[slot.group]!.push(team);
        });
        drawn.forEach((team, i) => members[openGroups[i]!]!.push(team));
    });

    return Object.fromEntries(
        letters.map(function (letter) {
            const teams = members[letter]!;
            const positions: (string | undefined)[] = new Array(teams.length).fill(undefined);

            teams.forEach(function (team) {
                const slot = fixedByTeam.get(team);
                if (slot) positions[slot.position] = team;
            });

            const free = shuffleArray(teams.filter((team) => !fixedByTeam.has(team)), rng);
            for (let i = 0; i < positions.length; i++) {
                if (positions[i] === undefined) positions[i] = free.shift();
            }

            return [letter, positions as Teams];
        }),
    );
}

/**
 * True when `groups` uses exactly the given letters and teams, four per group.
 * Guards against stale or hand-edited saved draws.
 */
export function isValidDraw(groups: unknown, letters: string[], teams: Teams): groups is Record<string, Teams> {
    if (!groups || typeof groups !== "object") return false;
    const entries = Object.entries(groups as Record<string, unknown>);

    if (entries.map(([l]) => l).sort().join() !== [...letters].sort().join()) return false;
    if (!entries.every(([, g]) => Array.isArray(g) && g.length === 4)) return false;

    const drawn = entries.flatMap(([, g]) => g as string[]);
    return drawn.length === teams.length && [...drawn].sort().join() === [...teams].sort().join();
}
