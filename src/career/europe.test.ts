import { describe, expect, it } from "vitest";
import { DOMESTIC_LEAGUES, TOURNAMENTS } from "../competitions.js";
import type { LeagueList, Teams } from "../interfaces/tournament.js";
import { UEFA_ALIASES } from "./aliases.js";
import {
    CLUB_COMPETITIONS,
    allocateEuropeanPlaces,
    europeanSlots,
    type ClubCompetition,
} from "./europe.js";
import { TOP_FLIGHTS } from "./rules.js";
import { careerSlots, leagueZones } from "./places.js";

const baseLists = {} as Record<ClubCompetition, Teams>;
CLUB_COMPETITIONS.forEach((c) => (baseLists[c] = TOURNAMENTS[c].teams));
const topFlights: Partial<Record<LeagueList, Teams>> = {};
TOP_FLIGHTS.forEach((l) => (topFlights[l] = DOMESTIC_LEAGUES[l].teams));
const slots = careerSlots();

function placesByLeague() {
    const counts: Record<string, string> = {};
    TOP_FLIGHTS.forEach((league) => {
        counts[league] = CLUB_COMPETITIONS.map(
            (c) => slots[c].filter((l) => l === league).length,
        ).join("/");
    });
    return counts;
}

describe("European places", () => {
    it("maps every alias to a real top-flight club in a UEFA list", () => {
        const domestic = new Set(
            TOP_FLIGHTS.flatMap((l) => DOMESTIC_LEAGUES[l].teams),
        );
        const uefa = new Set(
            CLUB_COMPETITIONS.flatMap((c) => TOURNAMENTS[c].teams),
        );
        Object.entries(UEFA_ALIASES).forEach(([uefaName, domesticName]) => {
            expect(uefa.has(uefaName), uefaName).toBe(true);
            expect(domestic.has(domesticName), domesticName).toBe(true);
        });
    });

    it("gives each league its real number of places (UCL/EL/CL)", () => {
        expect(placesByLeague()).toMatchInlineSnapshot(`
          {
            "belgian": "1/2/2",
            "dutch": "2/2/2",
            "english": "5/3/1",
            "french": "3/3/1",
            "german": "4/2/1",
            "greek": "1/2/1",
            "italian": "4/2/1",
            "russian": "2/1/1",
            "serbian": "0/0/1",
            "spanish": "5/2/1",
            "turkish": "2/1/1",
          }
        `);
    });
});

describe("allocateEuropeanPlaces", () => {
    it("fills a league's places with its top finishers, UCL first, keeping list size and other clubs", () => {
        const base = {
            ucl: ["Foreign A", "A1", "Foreign B", "A2"],
            el: ["A3", "Foreign C"],
            cl: ["Foreign D", "A4"],
        };
        const slots = europeanSlots(base, {
            english: ["A1", "A2", "A3", "A4", "A5"],
        });
        const lists = allocateEuropeanPlaces(base, slots, {
            english: ["X", "Y", "Z", "W", "V"],
        });

        expect(lists).toEqual({
            ucl: ["Foreign A", "X", "Foreign B", "Y"],
            el: ["Z", "Foreign C"],
            cl: ["Foreign D", "W"],
        });
    });

    it("never puts a club in two competitions with the real lists", () => {
        const standings: Partial<Record<LeagueList, Teams>> = {};
        TOP_FLIGHTS.forEach(
            (l) => (standings[l] = [...DOMESTIC_LEAGUES[l].teams].reverse()),
        );
        const lists = allocateEuropeanPlaces(baseLists, slots, standings);

        const all = CLUB_COMPETITIONS.flatMap((c) => lists[c]);
        expect(new Set(all).size).toBe(all.length);
        CLUB_COMPETITIONS.forEach((c) => expect(lists[c]).toHaveLength(36));
        // Last season's bottom club in England tops the reversed table: first English UCL place
        expect(lists.ucl).toContain("Coventry City");
    });
});

describe("leagueZones", () => {
    it("marks European places and relegation in a top flight with a play-off", () => {
        expect(leagueZones("german", 18)).toEqual([
            { from: 1, to: 4, kind: "ucl" },
            { from: 5, to: 6, kind: "el" },
            { from: 7, to: 7, kind: "cl" },
            { from: 16, to: 16, kind: "relegation-playoff" },
            { from: 17, to: 18, kind: "relegation" },
        ]);
    });

    it("marks three relegation places without a play-off", () => {
        expect(leagueZones("english", 20).slice(-1)).toEqual([
            { from: 18, to: 20, kind: "relegation" },
        ]);
    });

    it("marks promotion and play-off places in a second tier", () => {
        expect(leagueZones("english-2", 24)).toEqual([
            { from: 1, to: 3, kind: "promotion" },
        ]);
        expect(leagueZones("french-2", 18)).toEqual([
            { from: 1, to: 2, kind: "promotion" },
            { from: 3, to: 3, kind: "promotion-playoff" },
        ]);
    });

    it("marks only European places in a league without a second tier", () => {
        expect(leagueZones("russian", 16)).toEqual([
            { from: 1, to: 2, kind: "ucl" },
            { from: 3, to: 3, kind: "el" },
            { from: 4, to: 4, kind: "cl" },
        ]);
    });
});
