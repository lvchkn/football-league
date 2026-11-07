import type { LeagueList } from "../interfaces/tournament.js";

/**
 * Promotion and relegation between a top flight and its second tier.
 * `direct` teams swap automatically; with `playoff`, the top flight's next
 * team plays the second tier's next team over two legs for the last place.
 * Second-tier promotion play-offs are simplified to league position.
 */
export interface Pyramid {
    top: LeagueList;
    second: LeagueList;
    direct: number;
    playoff?: boolean;
}

export const PYRAMIDS: Pyramid[] = [
    { top: "english", second: "english-2", direct: 3 },
    { top: "spanish", second: "spanish-2", direct: 3 },
    { top: "italian", second: "italian-2", direct: 3 },
    // 16th in the Bundesliga plays 3rd in the 2. Bundesliga
    { top: "german", second: "german-2", direct: 2, playoff: true },
    // 16th in Ligue 1 plays Ligue 2's play-off qualifier (here: 3rd)
    { top: "french", second: "french-2", direct: 2, playoff: true },
];

/**
 * European places for leagues whose clubs are absent from the real UEFA
 * lists (UCL/EL/CL). The
 * places are taken from the lowest-seeded clubs of countries not in the app.
 */
export const EXTRA_EUROPEAN_PLACES: Partial<
    Record<LeagueList, [number, number, number]>
> = {
    russian: [2, 1, 1],
};

/** Leagues whose finishers can qualify for European competitions. */
export const TOP_FLIGHTS: LeagueList[] = [
    "english",
    "spanish",
    "italian",
    "german",
    "french",
    "dutch",
    "belgian",
    "russian",
    "serbian",
    "greek",
    "turkish",
];
