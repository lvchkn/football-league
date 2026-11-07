import type { LeagueList, Teams } from "../interfaces/tournament.js";
import { domesticName } from "./aliases.js";

export type ClubCompetition = "ucl" | "el" | "cl";

/** Order in which places are filled, so a club can't qualify twice. */
export const CLUB_COMPETITIONS: ClubCompetition[] = ["ucl", "el", "cl"];

/** For each list position: the league whose club holds it, or null. */
export type EuropeanSlots = Record<ClubCompetition, (LeagueList | null)[]>;

/**
 * Which league each position in the original UEFA lists belongs to. A
 * league's number of places is how many of its clubs the real lists contain;
 * positions held by clubs from other countries stay fixed.
 */
export function europeanSlots(
    baseLists: Record<ClubCompetition, Teams>,
    leagueRosters: Partial<Record<LeagueList, Teams>>,
    extraPlaces: Partial<Record<LeagueList, [number, number, number]>> = {},
): EuropeanSlots {
    const leagueOf = new Map<string, LeagueList>();
    (Object.entries(leagueRosters) as [LeagueList, Teams][]).forEach(([league, teams]) =>
        teams.forEach((team) => leagueOf.set(team, league)),
    );

    const slots = {} as EuropeanSlots;
    CLUB_COMPETITIONS.forEach((competition) => {
        slots[competition] = baseLists[competition].map(
            (team) => leagueOf.get(domesticName(team)) ?? null,
        );
    });

    (Object.entries(extraPlaces) as [LeagueList, [number, number, number]][]).forEach(
        ([league, counts]) =>
            CLUB_COMPETITIONS.forEach(function (competition, c) {
                let remaining = counts[c]!;
                const list = slots[competition];
                for (let i = list.length - 1; i >= 0 && remaining > 0; i--) {
                    if (list[i] === null) {
                        list[i] = league;
                        remaining--;
                    }
                }
            }),
    );
    return slots;
}

/** Places in [UCL, EL, CL] for one league. */
export function placeCounts(slots: EuropeanSlots, league: LeagueList): [number, number, number] {
    return CLUB_COMPETITIONS.map((c) => slots[c].filter((l) => l === league).length) as [
        number,
        number,
        number,
    ];
}

/**
 * Next season's UEFA lists: each league's positions are refilled with its
 * top finishers, best first into the highest-seeded position, Champions
 * League places before Europa League before Conference League.
 */
export function allocateEuropeanPlaces(
    baseLists: Record<ClubCompetition, Teams>,
    slots: EuropeanSlots,
    standings: Partial<Record<LeagueList, Teams>>,
): Record<ClubCompetition, Teams> {
    const nextIndex = new Map<LeagueList, number>();
    const lists = {} as Record<ClubCompetition, Teams>;

    CLUB_COMPETITIONS.forEach((competition) => {
        lists[competition] = baseLists[competition].map(function (team, i) {
            const league = slots[competition][i];
            const table = league && standings[league];
            if (!league || !table) return team;

            const index = nextIndex.get(league) ?? 0;
            nextIndex.set(league, index + 1);
            return table[index] ?? team;
        });
    });

    return lists;
}
