import type { Match, KnockoutMatch, MatchUpdate } from "../interfaces/match.js";
import type { LeaguePhase, KnockoutRound, Round } from "../interfaces/round.js";
import type { Table, TableRow } from "../interfaces/table.js";
import type {
    UEFACompetition,
    Teams,
    Phase,
    UEFAContext,
    CompetitionApp,
    UEFAHistoryEntry,
} from "../interfaces/tournament.js";

import * as uefaStorage from "./storage.js";
import { generateUEFAFixtures, getKnockoutWinners } from "./fixtures.js";
import { getUEFATeams } from "./teams.js";
import {
    renderPhaseProgressionButtons,
    renderUEFAFixtures,
    renderUEFAHistoryControls,
    renderUEFATable,
} from "./ui.js";
import {
    initUEFATable,
    applyUEFAMatchResult,
    removeUEFAMatchResult,
    sortUEFATable,
} from "./table.js";
import { computeRosterVersion } from "../utils/roster-version.js";
import { shuffleArray } from "../utils/shuffle.js";

function getUefaRosterVersion(competition: UEFACompetition): string | null {
    return computeRosterVersion(getUEFATeams(competition));
}

/**
 * Create a UEFA competition app for the given competition.
 */
export function createUEFAApp(selectedComp: UEFACompetition): CompetitionApp {
    let fixtures: LeaguePhase | KnockoutRound | Match = [];
    let table: Table = {};
    const competition: UEFACompetition = selectedComp;
    let teams: Teams = [];
    let currentUEFAPhase: Phase = "league";
    let history: UEFAHistoryEntry[] = [];
    let viewedHistoryPhase: Phase | null = null;

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
     * Update the UEFA standings table incrementally.
     */
    function updateTableIncrementally(updates: MatchUpdate[]): void {
        if (currentUEFAPhase === "league") {
            updates.forEach((update) => {
                removeUEFAMatchResult(update.oldMatch, table);
                applyUEFAMatchResult(update.match, table);
            });
            renderUEFATable(table, currentUEFAPhase);
        }
    }

    /**
     * Load fixtures from storage or generate fresh ones.
     */
    function initializeFixtures(): void {
        const rosterVersion = getUefaRosterVersion(competition);
        currentUEFAPhase = uefaStorage.getPhase(competition) || "league";
        const structure = uefaStorage.getFixturesStructure(
            competition,
            rosterVersion,
        );

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
                                match.tieIndex != null
                                    ? match.tieIndex
                                    : undefined,
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

            uefaStorage.setFixturesStructure(
                fixtures,
                competition,
                rosterVersion,
            );
            uefaStorage.setPhase(competition, currentUEFAPhase);
        }

        // Merge saved results
        try {
            const savedFixtures = uefaStorage.getFixtures(
                competition,
                rosterVersion,
            );

            if (savedFixtures && Array.isArray(savedFixtures)) {
                for (
                    let r = 0;
                    r <
                    Math.min(
                        savedFixtures.length,
                        (fixtures as Round[]).length,
                    );
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
                            (fixtures as Round[])[r].matches[
                                match
                            ].homePenalties = result.homePenalties;
                            (fixtures as Round[])[r].matches[
                                match
                            ].awayPenalties = result.awayPenalties;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to load saved results", e);
        }

        history = uefaStorage.getHistory(competition, rosterVersion);
    }

    /**
     * Render all fixtures for the current UEFA phase.
     */
    function renderAllFixtures(): void {
        const historyEntry = viewedHistoryPhase
            ? history.find((entry) => entry.phase === viewedHistoryPhase)
            : undefined;
        const displayedFixtures: Round[] = historyEntry
            ? historyEntry.fixtures
            : (fixtures as Round[]);
        const displayedPhase: Phase = historyEntry
            ? historyEntry.phase
            : currentUEFAPhase;
        const readOnly =
            Boolean(historyEntry) || currentUEFAPhase === "finished";

        const onResultsApplied = function (updates: MatchUpdate[]) {
            updateTableIncrementally(updates);
            uefaStorage.setFixturesDebounced(
                fixtures as Round[],
                competition,
                getUefaRosterVersion(competition),
            );
            if (currentUEFAPhase !== "league") {
                renderAllFixtures();
            }
        };

        renderUEFAFixtures(
            displayedFixtures,
            onResultsApplied,
            displayedPhase,
            readOnly,
        );

        renderUEFAHistoryControls(
            history,
            currentUEFAPhase,
            viewedHistoryPhase,
            function (phase: Phase) {
                viewedHistoryPhase = phase;
                renderAllFixtures();
            },
            function () {
                viewedHistoryPhase = null;
                renderAllFixtures();
            },
        );

        if (!readOnly && currentUEFAPhase !== "finished") {
            renderPhaseProgressionButtons(function () {
                progressPhase();
            });
        }
    }

    function archiveCurrentPhase(): void {
        const rosterVersion = getUefaRosterVersion(competition);
        uefaStorage.archivePhase(
            competition,
            currentUEFAPhase,
            fixtures as Round[],
            rosterVersion,
        );
        history = uefaStorage.getHistory(competition, rosterVersion);
    }

    /**
     * Progress competition through its phases.
     */
    function progressPhase(): void {
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

                const top8: Teams = sortedTableRows
                    .slice(0, 8)
                    .map(function (t) {
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
                const finalMatch = (fixtures as Round[])[0]?.matches[0];

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
                    const homePenalties = finalMatch.homePenalties;
                    const awayPenalties = finalMatch.awayPenalties;
                    const hasDecisivePenalties =
                        typeof homePenalties === "number" &&
                        typeof awayPenalties === "number" &&
                        Number.isInteger(homePenalties) &&
                        Number.isInteger(awayPenalties) &&
                        homePenalties >= 0 &&
                        awayPenalties >= 0 &&
                        homePenalties !== awayPenalties;

                    if (!hasDecisivePenalties) {
                        alert(
                            "A drawn final requires a decisive penalty shootout result.",
                        );
                        return;
                    }

                    champion =
                        homePenalties > awayPenalties
                            ? finalMatch.homeTeam
                            : finalMatch.awayTeam;
                }

                alert(champion + " wins the competition! 🏆");

                archiveCurrentPhase();
                uefaStorage.setFixturesImmediate(
                    fixtures as Round[],
                    competition,
                    getUefaRosterVersion(competition),
                );
                currentUEFAPhase = "finished";
                uefaStorage.setPhase(competition, "finished");

                recalcTable();
                renderAllFixtures();

                return;
            }

            default:
                return;
        }

        archiveCurrentPhase();
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
        uefaStorage.setFixturesStructure(
            fixtures as Round[],
            competition,
            getUefaRosterVersion(competition),
        );
        uefaStorage.setFixturesImmediate(
            fixtures as Round[],
            competition,
            getUefaRosterVersion(competition),
        );

        recalcTable();
        renderAllFixtures();
        window.scrollTo(0, 0);
    }

    function init(): void {
        teams = getUEFATeams(competition);
        initializeFixtures();
        recalcTable();
        renderAllFixtures();
    }

    function regenerate(): void {
        uefaStorage.clearAll(competition);

        currentUEFAPhase = "league";
        history = [];
        viewedHistoryPhase = null;
        fixtures = generateUEFAFixtures(
            shuffleArray(teams),
            currentUEFAPhase,
            {},
        ) as LeaguePhase;

        uefaStorage.setPhase(competition, currentUEFAPhase);
        uefaStorage.setFixturesStructure(
            fixtures,
            competition,
            getUefaRosterVersion(competition),
        );

        recalcTable();
        renderAllFixtures();
    }

    function save(): void {
        uefaStorage.setFixturesImmediate(
            fixtures as Round[],
            competition,
            getUefaRosterVersion(competition),
        );
    }

    function reset(): void {
        viewedHistoryPhase = null;
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
        uefaStorage.setFixturesImmediate(
            fixtures as Round[],
            competition,
            getUefaRosterVersion(competition),
        );
    }

    function destroy(): void {
        uefaStorage.cancelPendingSave(competition);
        table = {};
        fixtures = [];
        teams = [];
        history = [];
        viewedHistoryPhase = null;
    }

    return { init, save, reset, regenerate, destroy };
}
