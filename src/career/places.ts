import type { TableZone } from "../interfaces/table.js";
import type { LeagueList, Teams } from "../interfaces/tournament.js";
import { DOMESTIC_LEAGUES, TOURNAMENTS } from "../competitions.js";
import { CLUB_COMPETITIONS, europeanSlots, placeCounts, type ClubCompetition, type EuropeanSlots } from "./europe.js";
import { EXTRA_EUROPEAN_PLACES, PYRAMIDS, TOP_FLIGHTS } from "./rules.js";

/** The real UEFA lists, which Career mode refills each season. */
export function baseEuropeanLists(): Record<ClubCompetition, Teams> {
    const lists = {} as Record<ClubCompetition, Teams>;
    CLUB_COMPETITIONS.forEach((c) => (lists[c] = TOURNAMENTS[c].teams));
    return lists;
}

let cachedSlots: EuropeanSlots | null = null;

/** Which league owns each UEFA list position in Career mode. */
export function careerSlots(): EuropeanSlots {
    if (!cachedSlots) {
        const topFlights: Partial<Record<LeagueList, Teams>> = {};
        TOP_FLIGHTS.forEach((league) => (topFlights[league] = DOMESTIC_LEAGUES[league].teams));
        cachedSlots = europeanSlots(baseEuropeanLists(), topFlights, EXTRA_EUROPEAN_PLACES);
    }
    return cachedSlots;
}

/**
 * Highlighted positions of a league's table in Career mode: European
 * places at the top of a top flight, promotion at the top of a second tier,
 * play-off and relegation places at the bottom of a top flight.
 */
export function leagueZones(league: LeagueList, size: number): TableZone[] {
    const zones: TableZone[] = [];
    let next = 1;
    const add = (count: number, kind: TableZone["kind"]) => {
        if (count > 0) zones.push({ from: next, to: next + count - 1, kind });
        next += count;
    };

    if (TOP_FLIGHTS.includes(league)) {
        const [ucl, el, cl] = placeCounts(careerSlots(), league);
        add(ucl, "ucl");
        add(el, "el");
        add(cl, "cl");
    }

    const asTop = PYRAMIDS.find((rule) => rule.top === league);
    if (asTop) {
        const firstRelegated = size - asTop.direct + 1;
        if (asTop.playoff) zones.push({ from: firstRelegated - 1, to: firstRelegated - 1, kind: "relegation-playoff" });
        zones.push({ from: firstRelegated, to: size, kind: "relegation" });
    }

    const asSecond = PYRAMIDS.find((rule) => rule.second === league);
    if (asSecond) {
        next = 1;
        add(asSecond.direct, "promotion");
        if (asSecond.playoff) add(1, "promotion-playoff");
    }

    return zones;
}
