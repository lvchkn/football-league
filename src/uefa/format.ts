import type { TournamentFormat } from "../interfaces/tournament.js";
import {
    createPlayoffPairings,
    createR16Pairings,
    generateLeagueFixtures,
} from "./fixtures.js";

/**
 * Swiss-model format shared by the Champions, Europa and Conference League:
 * 36-team league phase, 9th-24th play off for the last 8 Round-of-16 places,
 * two-leg ties through the semi-finals, and a single-match final.
 *
 * The context each stage hands on keeps the shape already stored in
 * localStorage, so competitions saved mid-way keep working.
 */
export const UEFA_FORMAT: TournamentFormat = {
    stages: [
        {
            kind: "league",
            phase: "league",
            label: "League Phase",
            generate: generateLeagueFixtures,
            advance: (standings) => ({
                top8: standings.slice(0, 8),
                playoffTeams: standings.slice(8, 24),
            }),
        },
        {
            kind: "knockout",
            phase: "playoffs",
            label: "Knockout Playoffs",
            legs: 2,
            pairings: (ctx) => createPlayoffPairings(ctx.playoffTeams ?? []),
            advance: (winners, ctx) => ({
                top8: ctx.top8 ?? [],
                playoffWinners: winners,
            }),
        },
        {
            kind: "knockout",
            phase: "r16",
            label: "Round of 16",
            legs: 2,
            pairings: (ctx) => createR16Pairings(ctx.top8 ?? [], ctx.playoffWinners ?? []),
            advance: (winners) => ({ qualifiedTeams: winners }),
        },
        {
            kind: "knockout",
            phase: "quarterfinals",
            label: "Quarter-finals",
            legs: 2,
            pairings: (ctx) => createPlayoffPairings(ctx.qualifiedTeams ?? []),
            advance: (winners) => ({ qualifiedTeams: winners }),
        },
        {
            kind: "knockout",
            phase: "semifinals",
            label: "Semi-finals",
            legs: 2,
            pairings: (ctx) => createPlayoffPairings(ctx.qualifiedTeams ?? []),
            advance: (winners) => ({ finalists: winners }),
        },
        {
            kind: "knockout",
            phase: "final",
            label: "Final",
            legs: 1,
            pairings: (ctx) => {
                const [teamA = "", teamB = ""] = ctx.finalists ?? [];
                return [{ homeTeam: teamA, awayTeam: teamB }];
            },
        },
    ],
};
