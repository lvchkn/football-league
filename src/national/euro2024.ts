import type { TableRow } from "../interfaces/table.js";
import type { Teams, TournamentFormat } from "../interfaces/tournament.js";
import { pairAdjacent, rankThirdPlaced } from "../utils/groups.js";

/**
 * UEFA Euro 2024 groups, teams in draw position order (A1..A4).
 */
export const EURO_2024_GROUPS: Record<string, Teams> = {
    A: ["Germany", "Scotland", "Hungary", "Switzerland"],
    B: ["Spain", "Croatia", "Italy", "Albania"],
    C: ["Slovenia", "Denmark", "Serbia", "England"],
    D: ["Poland", "Netherlands", "Austria", "France"],
    E: ["Belgium", "Slovakia", "Romania", "Ukraine"],
    F: ["Türkiye", "Georgia", "Portugal", "Czechia"],
};

/**
 * All 24 teams by draw pot (pot 1 first). The simulation rates teams
 * from this order, like the UEFA club pots.
 */
export const EURO_2024_TEAMS: Teams = [
    // Pot 1
    "Germany", "Portugal", "France", "Spain", "Belgium", "England",
    // Pot 2
    "Hungary", "Türkiye", "Romania", "Denmark", "Albania", "Austria",
    // Pot 3
    "Netherlands", "Scotland", "Croatia", "Slovenia", "Slovakia", "Czechia",
    // Pot 4
    "Italy", "Serbia", "Switzerland", "Poland", "Ukraine", "Georgia",
];

/**
 * Which third-placed team each of 1B, 1C, 1E and 1F meets, keyed by the
 * groups whose third-placed teams qualified (UEFA Euro 2024 regulations).
 */
const THIRD_PLACE_OPPONENTS: Record<string, [string, string, string, string]> = {
    ABCD: ["A", "D", "B", "C"],
    ABCE: ["A", "E", "B", "C"],
    ABCF: ["A", "F", "B", "C"],
    ABDE: ["D", "E", "A", "B"],
    ABDF: ["D", "F", "A", "B"],
    ABEF: ["E", "F", "B", "A"],
    ACDE: ["E", "D", "C", "A"],
    ACDF: ["F", "D", "C", "A"],
    ACEF: ["E", "F", "C", "A"],
    ADEF: ["E", "F", "D", "A"],
    BCDE: ["E", "D", "B", "C"],
    BCDF: ["F", "D", "C", "B"],
    BCEF: ["F", "E", "C", "B"],
    BDEF: ["F", "E", "D", "B"],
    CDEF: ["F", "E", "D", "C"],
};

/**
 * Round-of-16 teams in bracket order: consecutive pairs are the ties, and
 * winners of consecutive ties meet in the next round, so later rounds just
 * pair neighbours. The tie order follows the official schedule.
 */
export function euro2024RoundOf16(tables: Record<string, TableRow[]>): Teams {
    const pos = (group: string, place: number) => tables[group]![place - 1]!.team;
    const thirds = rankThirdPlaced(tables).slice(0, 4);
    const key = thirds.map((t) => t.group).sort().join("");
    const opponents = THIRD_PLACE_OPPONENTS[key];

    if (!opponents) {
        throw new Error(`No Euro 2024 bracket for third-placed groups ${key}`);
    }

    const [vs1B, vs1C, vs1E, vs1F] = opponents.map((group) => pos(group, 3));

    return [
        pos("B", 1), vs1B!,
        pos("A", 1), pos("C", 2),
        pos("F", 1), vs1F!,
        pos("D", 2), pos("E", 2),
        pos("E", 1), vs1E!,
        pos("D", 1), pos("F", 2),
        pos("C", 1), vs1C!,
        pos("A", 2), pos("B", 2),
    ];
}

/**
 * Euro 2024: six groups of four, top two plus the four best third-placed
 * teams reach a single-match knockout bracket.
 */
export const EURO_2024_FORMAT: TournamentFormat = {
    stages: [
        {
            kind: "groups",
            phase: "groups",
            label: "Group Stage",
            groups: EURO_2024_GROUPS,
            pots: [0, 6, 12, 18].map((i) => EURO_2024_TEAMS.slice(i, i + 6)),
            // Hosts Germany always open the tournament in A1
            fixedDraw: [{ team: "Germany", group: "A", position: 0 }],
            qualifyingThirds: 4,
            advance: (tables) => ({ qualifiedTeams: euro2024RoundOf16(tables) }),
        },
        {
            kind: "knockout",
            phase: "r16",
            label: "Round of 16",
            legs: 1,
            pairings: (ctx) => pairAdjacent(ctx.qualifiedTeams ?? []),
            advance: (winners) => ({ qualifiedTeams: winners }),
        },
        {
            kind: "knockout",
            phase: "quarterfinals",
            label: "Quarter-finals",
            legs: 1,
            pairings: (ctx) => pairAdjacent(ctx.qualifiedTeams ?? []),
            advance: (winners) => ({ qualifiedTeams: winners }),
        },
        {
            kind: "knockout",
            phase: "semifinals",
            label: "Semi-finals",
            legs: 1,
            pairings: (ctx) => pairAdjacent(ctx.qualifiedTeams ?? []),
            advance: (winners) => ({ qualifiedTeams: winners }),
        },
        {
            kind: "knockout",
            phase: "final",
            label: "Final",
            legs: 1,
            pairings: (ctx) => pairAdjacent(ctx.qualifiedTeams ?? []),
        },
    ],
};
