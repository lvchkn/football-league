import {
    generateUEFAFixtures,
    getKnockoutWinners,
    type KnockoutMatch,
    type KnockoutRound,
    type LeaguePhase,
    type Match,
    type Phase,
    type Round,
    type UEFAContext,
} from "./uefa/fixtures.js";

import {
    initUEFATable,
    sortUEFATable,
    applyUEFAMatchResult,
    type Table,
    type TableRow,
} from "./uefa/table.js";

import {
    getUEFATeams,
    type Teams,
    type UEFACompetition,
} from "./uefa/teams.js";

import {
    renderPhaseProgressionButtons,
    renderUEFAFixtures,
    renderUEFATable,
} from "./uefa/ui.js";

import * as uefaStorage from "./uefa/storage.js";

import { _shuffleArray } from "./fixtures.js";

let fixtures: LeaguePhase | KnockoutRound | Match = [];
let table: Table = {};
let competition: UEFACompetition = "ucl";
let teams: Teams = [];
let currentUEFAPhase: Phase = "league";

/**
 * Recalculate the UEFA league table from fixtures.
 */
function recalcTable(): void {
    if (currentUEFAPhase === "league") {
        table = initUEFATable(teams);
        (fixtures as LeaguePhase).forEach((round: Round) =>
            round.matches.forEach(function (match: Match) {
                applyUEFAMatchResult(match, table);
            }),
        );
        renderUEFATable(table, currentUEFAPhase);
    } else {
        renderUEFATable({}, currentUEFAPhase);
    }
}

/**
 * Load fixtures from storage or generate fresh ones.
 */
function initializeFixtures(): void {
    currentUEFAPhase = uefaStorage.getPhase(competition) || "league";
    const structure = uefaStorage.getFixturesStructure(competition);

    if (structure) {
        fixtures = structure.map(function (round: any[]) {
            return {
                matches: round.map(function (match: any) {
                    return {
                        homeTeam: match.homeTeam || match.home,
                        awayTeam: match.awayTeam || match.away,
                        homeGoals: null,
                        awayGoals: null,
                        leg: match.leg != null ? match.leg : undefined,
                        tieIndex:
                            match.tieIndex != null ? match.tieIndex : undefined,
                    };
                }),
            };
        });
    } else {
        currentUEFAPhase = "league";
        fixtures = generateUEFAFixtures(
            teams,
            currentUEFAPhase,
            {},
        ) as LeaguePhase;

        uefaStorage.setFixturesStructure(fixtures, competition);
        uefaStorage.setPhase(competition, currentUEFAPhase);
    }

    // Merge saved results
    try {
        const savedFixtures = uefaStorage.getFixtures(competition);

        if (savedFixtures && Array.isArray(savedFixtures)) {
            for (
                let r = 0;
                r <
                Math.min(savedFixtures.length, (fixtures as Round[]).length);
                r++
            ) {
                const roundMatches = savedFixtures[r];
                if (!Array.isArray(roundMatches)) continue;
                for (
                    let match = 0;
                    match <
                    Math.min(
                        roundMatches.length,
                        (fixtures as Round[])[r].matches.length,
                    );
                    match++
                ) {
                    const result = roundMatches[match];
                    if (
                        result &&
                        typeof result.homeGoals !== "undefined" &&
                        typeof result.awayGoals !== "undefined"
                    ) {
                        (fixtures as Round[])[r].matches[match].homeGoals =
                            result.homeGoals;
                        (fixtures as Round[])[r].matches[match].awayGoals =
                            result.awayGoals;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Failed to load saved results", e);
    }
}

/**
 * Render all fixtures for the current UEFA phase.
 */
function renderAllFixtures(): void {
    const onResultApplied = function () {
        recalcTable();
        uefaStorage.setFixturesDebounced(fixtures as Round[], competition);
    };

    renderUEFAFixtures(
        currentUEFAPhase === "league"
            ? (fixtures as LeaguePhase)
            : (fixtures as KnockoutRound[]),
        onResultApplied,
        currentUEFAPhase,
    );

    if (currentUEFAPhase !== "finished") {
        renderPhaseProgressionButtons(function () {
            progressPhase();
        });
    }
}

/**
 * Initialize a UEFA competition: load teams, phase, fixtures, render.
 * @param {UEFACompetition} selectedComp
 */
export function init(selectedComp: UEFACompetition): void {
    competition = selectedComp;
    teams = getUEFATeams(competition);
    initializeFixtures();
    recalcTable();
    renderAllFixtures();
}

/**
 * Regenerate fixtures and reset to league phase.
 */
export function regenerate(): void {
    uefaStorage.clearAll(competition);

    currentUEFAPhase = "league";
    fixtures = generateUEFAFixtures(
        _shuffleArray(teams),
        currentUEFAPhase,
        {},
    ) as LeaguePhase;

    uefaStorage.setPhase(competition, currentUEFAPhase);
    uefaStorage.setFixturesStructure(fixtures, competition);

    recalcTable();
    renderAllFixtures();
}

/**
 * Persist current fixtures immediately.
 */
export function save(): void {
    uefaStorage.setFixturesImmediate(fixtures as Round[], competition);
}

/**
 * Reset all scores to null and re-render.
 */
export function reset(): void {
    fixtures = (fixtures as Round[]).map(function (round: Round) {
        return {
            matches: round.matches.map(function (match: Match) {
                return {
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    homeGoals: null,
                    awayGoals: null,
                    leg:
                        (match as KnockoutMatch).leg != null
                            ? (match as KnockoutMatch).leg
                            : undefined,
                    tieIndex:
                        (match as KnockoutMatch).tieIndex != null
                            ? (match as KnockoutMatch).tieIndex
                            : undefined,
                };
            }),
        };
    }) as LeaguePhase | KnockoutRound | Match;
    recalcTable();
    renderAllFixtures();
    uefaStorage.setFixturesImmediate(fixtures as Round[], competition);
}

/**
 * Progress competition through its phases.
 */
export function progressPhase(): void {
    // Verify all matches in the current phase are complete
    const allMatches: Match[] = (fixtures as Round[])
        .map((round: Round) => round.matches)
        .flat();

    const incomplete: boolean = allMatches.some(function (m) {
        return m.homeGoals === null || m.awayGoals === null;
    });

    if (incomplete) {
        alert(
            "Please complete all matches in the current phase before advancing.",
        );
        return;
    }

    let nextPhase: Phase;
    let nextFixtures: LeaguePhase | KnockoutRound | Match;

    switch (currentUEFAPhase) {
        case "league": {
            // Compute final league standings
            const sortedTableRows: TableRow[] = sortUEFATable(table);

            const top8: Teams = sortedTableRows.slice(0, 8).map(function (t) {
                return t.team;
            });

            const playoffTeams: Teams = sortedTableRows
                .slice(8, 24)
                .map(function (t) {
                    return t.team;
                });

            nextPhase = "playoffs";
            nextFixtures = generateUEFAFixtures([], "playoffs", {
                playoffTeams: playoffTeams,
            });

            uefaStorage.setPhaseContext(competition, {
                top8: top8,
                playoffTeams: playoffTeams,
            });

            break;
        }

        case "playoffs": {
            const winners = getKnockoutWinners(
                (fixtures as Round[])[0] as KnockoutRound,
            );
            if (winners.length !== 8) {
                alert(
                    "Could not determine all 8 playoff winners. Check results.",
                );
                return;
            }

            const ctx: UEFAContext =
                uefaStorage.getPhaseContext(competition) || {};
            const top8FromLeague: Teams = ctx.top8 || [];

            nextPhase = "r16";
            nextFixtures = generateUEFAFixtures([], "r16", {
                top8: top8FromLeague,
                playoffWinners: winners,
            });

            uefaStorage.setPhaseContext(competition, {
                top8: top8FromLeague,
                playoffWinners: winners,
            });

            break;
        }

        case "r16": {
            const winners = getKnockoutWinners(
                (fixtures as Round[])[0] as KnockoutRound,
            );

            if (winners.length !== 8) {
                alert(
                    "Could not determine all 8 Round-of-16 winners. Check results.",
                );
                return;
            }

            nextPhase = "quarterfinals";

            nextFixtures = generateUEFAFixtures([], "quarterfinals", {
                qualifiedTeams: winners,
            });

            uefaStorage.setPhaseContext(competition, {
                qualifiedTeams: winners,
            });

            break;
        }

        case "quarterfinals": {
            const winners = getKnockoutWinners(
                (fixtures as Round[])[0] as KnockoutRound,
            );

            if (winners.length !== 4) {
                alert(
                    "Could not determine all 4 Quarter-final winners. Check results.",
                );
                return;
            }

            nextPhase = "semifinals";

            nextFixtures = generateUEFAFixtures([], "semifinals", {
                qualifiedTeams: winners,
            });

            uefaStorage.setPhaseContext(competition, {
                qualifiedTeams: winners,
            });

            break;
        }

        case "semifinals": {
            const winners = getKnockoutWinners(
                (fixtures as Round[])[0] as KnockoutRound,
            );

            if (winners.length !== 2) {
                alert(
                    "Could not determine both Semi-final winners. Check results.",
                );
                return;
            }

            nextPhase = "final";

            nextFixtures = generateUEFAFixtures([], "final", {
                finalists: winners,
            });

            uefaStorage.setPhaseContext(competition, {
                finalists: winners,
            });

            break;
        }

        case "final": {
            const finalMatch = (fixtures as Round[])[0]?.matches[0]; // Wait, fixtures is Match in some older typings? Actually returning Match is weird, our API returns Round

            if (
                !finalMatch ||
                finalMatch.homeGoals === null ||
                finalMatch.awayGoals === null
            ) {
                alert(
                    "Please complete the final match before determining winner.",
                );
                return;
            }

            let champion: string;

            if (finalMatch.homeGoals > finalMatch.awayGoals) {
                champion = finalMatch.homeTeam;
            } else if (finalMatch.awayGoals > finalMatch.homeGoals) {
                champion = finalMatch.awayTeam;
            } else {
                champion = finalMatch.homeTeam; // Draw simulating penalties
            }

            alert(champion + " wins the competition! 🏆");

            currentUEFAPhase = "finished";
            uefaStorage.setPhase(competition, "finished");

            return;
        }

        default:
            return;
    }

    currentUEFAPhase = nextPhase;
    // Ensure final is a Round array for consistency
    let finalFixtures: Round[];
    if (Array.isArray(nextFixtures)) {
        finalFixtures = nextFixtures as Round[];
    } else if ("matches" in nextFixtures) {
        finalFixtures = [nextFixtures as KnockoutRound];
    } else {
        finalFixtures = [{ matches: [nextFixtures as Match] }];
    }
    fixtures = finalFixtures;

    uefaStorage.setPhase(competition, nextPhase);
    uefaStorage.setFixturesStructure(fixtures as Round[], competition);

    recalcTable();
    renderAllFixtures();
}
