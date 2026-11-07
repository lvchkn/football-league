import type { LeagueMatch } from "../interfaces/match.js";
import type { Round } from "../interfaces/round.js";
import type { TableRow } from "../interfaces/table.js";
import type { Teams } from "../interfaces/tournament.js";
import { applyMatchResult, initTable, sortTable } from "./table.js";
import { shuffleArray } from "./shuffle.js";

/**
 * Single round-robin order for a four-team group, by draw position,
 * as used at the Euro and World Cup: 1v2 3v4, 1v3 2v4, 4v1 2v3.
 */
export type GroupSchedule = [number, number][][];

export const FOUR_TEAM_SCHEDULE: GroupSchedule = [
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
export function generateGroupFixtures(
    groups: Record<string, Teams>,
    schedule: GroupSchedule = FOUR_TEAM_SCHEDULE,
): Round[] {
    const letters = Object.keys(groups).sort();

    letters.forEach(function (letter) {
        if (groups[letter]!.length !== 4) {
            throw new Error(`Group ${letter} must have exactly 4 teams`);
        }
    });

    return schedule.map(function (pairs) {
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

export interface ThirdPlaceRanking {
    /** Whether wins count after goals scored (UEFA: yes, FIFA: no). */
    useWins?: boolean;
    /** Final fallback, best first, e.g. the FIFA ranking. */
    seedOrder?: Teams;
}

/**
 * Rank the third-placed teams across groups: points, goal difference,
 * goals scored, then optionally wins. Remaining ties fall back to the seed
 * order and then group letter, standing in for the disciplinary criteria
 * the app doesn't track.
 */
export function rankThirdPlaced(
    tables: Record<string, TableRow[]>,
    { useWins = true, seedOrder = [] }: ThirdPlaceRanking = {},
): RankedThird[] {
    const seed = (team: string) => {
        const index = seedOrder.indexOf(team);
        return index === -1 ? seedOrder.length : index;
    };

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
                (useWins ? y.wins - x.wins : 0) ||
                seed(x.team) - seed(y.team) ||
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

export interface DrawRules {
    /** Teams pre-assigned to a group (and position, unless positionOf decides). */
    fixed?: FixedDrawSlot[];
    /** Position within a group for a team from a given pot (0-based). */
    positionOf?: (group: string, potIndex: number) => number;
    /** Whether a team may join a group that already holds these teams. */
    canPlace?: (groupTeams: Teams, team: string) => boolean;
    /** Prune draws that can no longer be completed legally. */
    feasible?: (members: Record<string, Teams>, unplaced: Teams) => boolean;
}

/**
 * Draw groups from seeding pots: each group gets one team from every pot,
 * respecting fixed slots and any placement rules (backtracking when a
 * choice leads to a dead end). Positions within a group follow
 * `positionOf` when given, otherwise they are drawn too.
 */
export function drawGroups(
    pots: Teams[],
    letters: string[],
    rules: DrawRules = {},
    rng: () => number = Math.random,
): Record<string, Teams> {
    pots.forEach(function (pot, i) {
        if (pot.length !== letters.length) {
            throw new Error(`Pot ${i + 1} has ${pot.length} teams for ${letters.length} groups`);
        }
    });

    const { fixed = [], positionOf, canPlace = () => true, feasible = () => true } = rules;
    const fixedByTeam = new Map(fixed.map((slot) => [slot.team, slot]));
    const potOf = new Map(pots.flatMap((pot, i) => pot.map((team) => [team, i] as const)));
    const members: Record<string, Teams> = Object.fromEntries(letters.map((l) => [l, []]));
    const filledPots: Record<string, Set<number>> = Object.fromEntries(
        letters.map((l) => [l, new Set<number>()]),
    );

    fixed.forEach(function (slot) {
        members[slot.group]!.push(slot.team);
        filledPots[slot.group]!.add(potOf.get(slot.team)!);
    });

    const queue = pots.flatMap((pot) => shuffleArray(pot.filter((t) => !fixedByTeam.has(t)), rng));

    function place(index: number): boolean {
        if (index === queue.length) return true;

        const team = queue[index]!;
        const pot = potOf.get(team)!;
        const candidates = shuffleArray(
            letters.filter(
                (letter) => !filledPots[letter]!.has(pot) && canPlace(members[letter]!, team),
            ),
            rng,
        );

        for (const letter of candidates) {
            members[letter]!.push(team);
            filledPots[letter]!.add(pot);

            if (feasible(members, queue.slice(index + 1)) && place(index + 1)) return true;

            members[letter]!.pop();
            filledPots[letter]!.delete(pot);
        }

        return false;
    }

    if (!place(0)) {
        throw new Error("No legal group draw exists for these pots and rules");
    }

    return Object.fromEntries(
        letters.map(function (letter) {
            const teams = members[letter]!;
            const positions: (string | undefined)[] = new Array(teams.length).fill(undefined);

            if (positionOf) {
                teams.forEach((team) => (positions[positionOf(letter, potOf.get(team)!)] = team));
                return [letter, positions as Teams];
            }

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
