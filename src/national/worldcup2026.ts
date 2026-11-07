import type { TableRow } from "../interfaces/table.js";
import type { Teams, TournamentFormat } from "../interfaces/tournament.js";
import {
    pairAdjacent,
    rankThirdPlaced,
    type DrawRules,
    type GroupSchedule,
    type ThirdPlaceRanking,
} from "../utils/groups.js";
import {
    WC_2026_THIRD_PLACE_OPPONENTS,
    WC_2026_THIRD_PLACE_SLOTS,
} from "./worldcup2026-thirds.js";

/**
 * FIFA World Cup 2026 groups from the December 5, 2025 draw, teams in
 * draw position order (A1..A4).
 */
export const WC_2026_GROUPS: Record<string, Teams> = {
    A: ["Mexico", "South Africa", "South Korea", "Czechia"],
    B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    C: ["Brazil", "Morocco", "Haiti", "Scotland"],
    D: ["United States", "Paraguay", "Australia", "Türkiye"],
    E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
    F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    G: ["Belgium", "Egypt", "Iran", "New Zealand"],
    H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    I: ["France", "Senegal", "Iraq", "Norway"],
    J: ["Argentina", "Algeria", "Austria", "Jordan"],
    K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
    L: ["England", "Croatia", "Ghana", "Panama"],
};

/**
 * Draw pots. Pots 1-3 and the first six of pot 4 are in FIFA ranking order
 * (November 2025); the last six of pot 4 qualified through the playoffs
 * after the draw and had no ranked slot, so they come last.
 */
export const WC_2026_POTS: Teams[] = [
    [
        "Spain", "Argentina", "France", "England", "Brazil", "Portugal",
        "Netherlands", "Belgium", "Germany", "United States", "Mexico", "Canada",
    ],
    [
        "Croatia", "Morocco", "Colombia", "Uruguay", "Switzerland", "Japan",
        "Senegal", "Iran", "South Korea", "Ecuador", "Austria", "Australia",
    ],
    [
        "Norway", "Panama", "Egypt", "Algeria", "Scotland", "Paraguay",
        "Tunisia", "Ivory Coast", "Uzbekistan", "Qatar", "Saudi Arabia", "South Africa",
    ],
    [
        "Jordan", "Cape Verde", "Ghana", "Curaçao", "Haiti", "New Zealand",
        "Czechia", "Bosnia and Herzegovina", "Türkiye", "Sweden", "Iraq", "DR Congo",
    ],
];

/** All 48 teams, strongest first: the simulation rates teams from this order. */
export const WC_2026_TEAMS: Teams = WC_2026_POTS.flat();

type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

const CONFEDERATIONS: Record<Confederation, Teams> = {
    UEFA: [
        "Spain", "France", "England", "Portugal", "Netherlands", "Belgium", "Germany",
        "Croatia", "Switzerland", "Austria", "Norway", "Scotland",
        "Czechia", "Bosnia and Herzegovina", "Türkiye", "Sweden",
    ],
    CONMEBOL: ["Argentina", "Brazil", "Colombia", "Uruguay", "Ecuador", "Paraguay"],
    CONCACAF: ["United States", "Mexico", "Canada", "Panama", "Curaçao", "Haiti"],
    CAF: [
        "Morocco", "Senegal", "Egypt", "Algeria", "Tunisia", "Ivory Coast",
        "South Africa", "Cape Verde", "Ghana", "DR Congo",
    ],
    AFC: [
        "Japan", "Iran", "South Korea", "Australia", "Uzbekistan", "Qatar",
        "Saudi Arabia", "Jordan", "Iraq",
    ],
    OFC: ["New Zealand"],
};

const confederationOf = new Map(
    Object.entries(CONFEDERATIONS).flatMap(([conf, teams]) =>
        teams.map((team) => [team, conf as Confederation] as const),
    ),
);

export function getConfederation(team: string): Confederation | undefined {
    return confederationOf.get(team);
}

/**
 * Where each pot's team sits within a group, by group (draw procedure):
 * the pot 1 team is always position 1.
 */
const POSITION_BY_POT: Record<string, number[]> = {
    ADGJ: [0, 2, 1, 3], // pos 2: pot 3, pos 3: pot 2, pos 4: pot 4
    BEHK: [0, 3, 2, 1], // pos 2: pot 4, pos 3: pot 3, pos 4: pot 2
    CFIL: [0, 1, 3, 2], // pos 2: pot 2, pos 3: pot 4, pos 4: pot 3
};

function positionOf(group: string, potIndex: number): number {
    const pattern = Object.keys(POSITION_BY_POT).find((letters) => letters.includes(group))!;
    return POSITION_BY_POT[pattern]![potIndex]!;
}

/**
 * Draw constraints: hosts in A1, B1 and D1; at most one team per
 * confederation in a group, except UEFA with one or two in every group.
 */
export const WC_2026_DRAW_RULES: DrawRules = {
    fixed: [
        { team: "Mexico", group: "A", position: 0 },
        { team: "Canada", group: "B", position: 0 },
        { team: "United States", group: "D", position: 0 },
    ],
    positionOf,
    canPlace(groupTeams, team) {
        const conf = getConfederation(team);
        const same = groupTeams.filter((t) => getConfederation(t) === conf).length;
        return same < (conf === "UEFA" ? 2 : 1);
    },
    feasible(members, unplaced) {
        // Every group still lacking a European team needs one left to draw
        const groupsWithoutUefa = Object.values(members).filter(
            (teams) => !teams.some((t) => getConfederation(t) === "UEFA"),
        ).length;
        const uefaLeft = unplaced.filter((t) => getConfederation(t) === "UEFA").length;
        return groupsWithoutUefa <= uefaLeft;
    },
};

/** Match order within a group: 1v2 3v4, 4v2 1v3, 4v1 2v3. */
export const WC_2026_SCHEDULE: GroupSchedule = [
    [
        [0, 1],
        [2, 3],
    ],
    [
        [3, 1],
        [0, 2],
    ],
    [
        [3, 0],
        [1, 2],
    ],
];

/**
 * Third-placed teams are compared on points, goal difference and goals
 * scored, then (no fair-play data here) the FIFA ranking order.
 */
export const WC_2026_THIRD_PLACE_RANKING: ThirdPlaceRanking = {
    useWins: false,
    seedOrder: WC_2026_TEAMS,
};

/**
 * Round-of-32 teams in bracket order: consecutive pairs are the ties and
 * winners of consecutive ties meet next, so later rounds pair neighbours.
 * Ties follow FIFA's match numbers 74, 77, 73, 75, 83, 84, 81, 82, 76, 78,
 * 79, 80, 86, 88, 85, 87, the order of the official bracket.
 */
export function wc2026RoundOf32(tables: Record<string, TableRow[]>): Teams {
    const pos = (group: string, place: number) => tables[group]![place - 1]!.team;
    const thirds = rankThirdPlaced(tables, WC_2026_THIRD_PLACE_RANKING).slice(0, 8);
    const key = thirds.map((t) => t.group).sort().join("");
    const opponents = WC_2026_THIRD_PLACE_OPPONENTS[key];

    if (!opponents) {
        throw new Error(`No World Cup 2026 bracket for third-placed groups ${key}`);
    }

    const third = (winnerGroup: (typeof WC_2026_THIRD_PLACE_SLOTS)[number]) =>
        pos(opponents[WC_2026_THIRD_PLACE_SLOTS.indexOf(winnerGroup)]!, 3);

    return [
        pos("E", 1), third("E"), // 74
        pos("I", 1), third("I"), // 77
        pos("A", 2), pos("B", 2), // 73
        pos("F", 1), pos("C", 2), // 75
        pos("K", 2), pos("L", 2), // 83
        pos("H", 1), pos("J", 2), // 84
        pos("D", 1), third("D"), // 81
        pos("G", 1), third("G"), // 82
        pos("C", 1), pos("F", 2), // 76
        pos("E", 2), pos("I", 2), // 78
        pos("A", 1), third("A"), // 79
        pos("L", 1), third("L"), // 80
        pos("J", 1), pos("H", 2), // 86
        pos("D", 2), pos("G", 2), // 88
        pos("B", 1), third("B"), // 85
        pos("K", 1), third("K"), // 87
    ];
}

const singleMatch = (phase: "r16" | "quarterfinals" | "semifinals", label: string) => ({
    kind: "knockout" as const,
    phase,
    label,
    legs: 1 as const,
    pairings: (ctx: { qualifiedTeams?: Teams }) => pairAdjacent(ctx.qualifiedTeams ?? []),
    advance: (winners: Teams) => ({ qualifiedTeams: winners }),
});

/**
 * World Cup 2026: twelve groups of four, top two plus the eight best
 * third-placed teams reach a single-match round of 32.
 */
export const WC_2026_FORMAT: TournamentFormat = {
    stages: [
        {
            kind: "groups",
            phase: "groups",
            label: "Group Stage",
            groups: WC_2026_GROUPS,
            schedule: WC_2026_SCHEDULE,
            thirdPlaceRanking: WC_2026_THIRD_PLACE_RANKING,
            pots: WC_2026_POTS,
            drawRules: WC_2026_DRAW_RULES,
            qualifyingThirds: 8,
            advance: (tables) => ({ qualifiedTeams: wc2026RoundOf32(tables) }),
        },
        {
            kind: "knockout",
            phase: "r32",
            label: "Round of 32",
            legs: 1,
            pairings: (ctx) => pairAdjacent(ctx.qualifiedTeams ?? []),
            advance: (winners) => ({ qualifiedTeams: winners }),
        },
        singleMatch("r16", "Round of 16"),
        singleMatch("quarterfinals", "Quarter-finals"),
        singleMatch("semifinals", "Semi-finals"),
        {
            kind: "knockout",
            phase: "final",
            label: "Final",
            legs: 1,
            pairings: (ctx) => pairAdjacent(ctx.qualifiedTeams ?? []),
        },
    ],
};
