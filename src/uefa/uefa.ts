import type { Match, KnockoutMatch, MatchUpdate } from "../interfaces/match.js";
import type { LeaguePhase, Round } from "../interfaces/round.js";
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
import { getUEFATeams } from "./teams.js";
import {
    renderPhaseProgressionButtons,
    renderUEFAFixtures,
    renderUEFAHistoryControls,
    renderUEFATable,
    renderGroupTables,
    resetStandingsView,
} from "./ui.js";
import {
    initUEFATable,
    applyUEFAMatchResult,
    removeUEFAMatchResult,
    sortUEFATable,
} from "./table.js";
import { computeRosterVersion } from "../utils/roster-version.js";
import { countTies, getKnockoutWinners } from "../utils/knockout.js";
import {
    generateStageFixtures,
    getFormat,
    withGroups,
    getNextStage,
    getPhaseLabel,
    getStage,
} from "../tournament-format.js";
import { shuffleArray } from "../utils/shuffle.js";
import {
    ratingsFromSeeding,
    simulateKnockoutRound,
    simulateLeagueRounds,
} from "../utils/simulation.js";
import { collectTypedResults, syncScoreInputs } from "../simulation-controls.js";
import {
    computeGroupTables,
    drawGroups,
    isValidDraw,
    rankThirdPlaced,
} from "../utils/groups.js";

function getUefaRosterVersion(competition: UEFACompetition): string | null {
    return computeRosterVersion(getUEFATeams(competition));
}

/**
 * Create a UEFA competition app for the given competition.
 */
export function createUEFAApp(selectedComp: UEFACompetition): CompetitionApp {
    const baseFormat = getFormat(selectedComp);
    let format = baseFormat;
    let fixtures: Round[] = [];
    let table: Table = {};
    const competition: UEFACompetition = selectedComp;
    let teams: Teams = [];
    let currentUEFAPhase: Phase = "league";
    let history: UEFAHistoryEntry[] = [];
    let viewedHistoryPhase: Phase | null = null;

    function currentStageKind() {
        return getStage(format, currentUEFAPhase)?.kind;
    }

    function renderGroupStandings(): void {
        const stage = getStage(format, currentUEFAPhase);
        if (stage?.kind !== "groups") return;

        const tables = computeGroupTables(stage.groups, fixtures);
        renderGroupTables(
            tables,
            rankThirdPlaced(tables, stage.thirdPlaceRanking),
            stage.qualifyingThirds,
            fixtures,
        );
    }

    /**
     * Recalculate the standings (league table or group tables) from fixtures.
     */
    function recalcTable(): void {
        if (currentStageKind() === "groups") {
            renderGroupStandings();
        } else if (currentStageKind() === "league") {
            table = initUEFATable(teams);
            (fixtures as LeaguePhase).forEach((round: Round) =>
                round.matches.forEach(function (match: Match) {
                    applyUEFAMatchResult(match, table);
                }),
            );
            renderUEFATable(table, true, fixtures as LeaguePhase);
        } else {
            renderUEFATable({}, false);
        }
    }

    /**
     * Update the UEFA standings table incrementally.
     */
    function updateTableIncrementally(updates: MatchUpdate[]): void {
        if (currentStageKind() === "groups") {
            // Four-team groups are cheap to rebuild from scratch
            renderGroupStandings();
        } else if (currentStageKind() === "league") {
            updates.forEach((update) => {
                removeUEFAMatchResult(update.oldMatch, table);
                applyUEFAMatchResult(update.match, table);
            });
            renderUEFATable(table, true, fixtures as LeaguePhase);
        }
    }

    /**
     * Load fixtures from storage or generate fresh ones.
     */
    function initializeFixtures(): void {
        const rosterVersion = getUefaRosterVersion(competition);
        currentUEFAPhase =
            uefaStorage.getPhase(competition) || format.stages[0]!.phase;
        let structure = uefaStorage.getFixturesStructure(
            competition,
            rosterVersion,
        );

        // A stored phase this format doesn't know means stale data: start over
        if (!getStage(format, currentUEFAPhase)) {
            uefaStorage.clearAll(competition);
            structure = null;
        }

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
            currentUEFAPhase = format.stages[0]!.phase;
            fixtures = generateStageFixtures(format.stages[0]!, teams, {});

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
            if (currentStageKind() === "knockout") {
                renderAllFixtures();
            }
        };

        const displayedStage = getStage(format, displayedPhase);
        if (!displayedStage) return;

        renderUEFAFixtures(
            displayedFixtures,
            onResultsApplied,
            displayedStage,
            (readOnly ? "Viewing completed phase: " : "Current Phase: ") +
                getPhaseLabel(format, displayedPhase),
            readOnly,
            simulate,
        );

        renderUEFAHistoryControls(
            history,
            (phase: Phase) => getPhaseLabel(format, phase),
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

    /**
     * Fill unplayed matches of the current phase with simulated scores.
     * Knockout ties that end level are settled with a simulated shootout.
     */
    function simulate(roundIndices: number[]): void {
        if (viewedHistoryPhase || currentUEFAPhase === "finished") return;

        const stage = getStage(format, currentUEFAPhase);
        if (!stage) return;

        const rounds = fixtures;
        const ratingOf = ratingsFromSeeding(getUEFATeams(competition));
        const typed = collectTypedResults(rounds, roundIndices);

        const simulated: MatchUpdate[] =
            stage.kind !== "knockout"
                ? simulateLeagueRounds(rounds, roundIndices, ratingOf)
                : simulateKnockoutRound(
                      rounds[0]?.matches ?? [],
                      stage.legs,
                      ratingOf,
                  );

        const updates = [...typed, ...simulated];
        if (updates.length === 0) return;

        updateTableIncrementally(updates);
        uefaStorage.setFixturesDebounced(
            rounds,
            competition,
            getUefaRosterVersion(competition),
        );

        if (stage.kind !== "knockout") {
            syncScoreInputs(rounds, roundIndices);
        } else {
            // Re-render to show aggregates and penalty shootouts
            renderAllFixtures();
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
     * Complete the current stage and move on to the next one, or crown the
     * champion when the last stage is done.
     */
    function progressPhase(): void {
        const rounds = fixtures as Round[];
        const stage = getStage(format, currentUEFAPhase);
        if (!stage || currentUEFAPhase === "finished") return;

        const incomplete: boolean = rounds
            .flatMap((round: Round) => round.matches)
            .some((m) => m.homeGoals === null || m.awayGoals === null);

        if (incomplete) {
            alert(
                "Please complete all matches in the current phase before advancing.",
            );
            return;
        }

        // Teams that came through this stage, best first
        let qualified: Teams = [];

        if (stage.kind === "league") {
            qualified = sortUEFATable(table).map((row: TableRow) => row.team);
        } else if (stage.kind === "knockout") {
            const round = rounds[0] ?? { matches: [] };
            const ties = countTies(round, stage.legs);
            qualified = getKnockoutWinners(round, stage.legs);

            if (qualified.length !== ties) {
                alert(
                    ties === 1
                        ? `A drawn ${stage.label} requires a decisive penalty shootout result.`
                        : `Could not determine all ${ties} ${stage.label} winners. Check results.`,
                );
                return;
            }
        }

        const nextStage = getNextStage(format, currentUEFAPhase);

        if (!nextStage) {
            alert(qualified[0] + " wins the competition! 🏆");

            archiveCurrentPhase();
            uefaStorage.setFixturesImmediate(
                rounds,
                competition,
                getUefaRosterVersion(competition),
            );
            currentUEFAPhase = "finished";
            uefaStorage.setPhase(competition, "finished");

            recalcTable();
            renderAllFixtures();
            return;
        }

        const context: UEFAContext =
            uefaStorage.getPhaseContext(competition) || {};
        let nextContext: UEFAContext;
        if (stage.kind === "groups") {
            nextContext = stage.advance(
                computeGroupTables(stage.groups, rounds),
                context,
            );
        } else if (stage.kind === "league") {
            nextContext = stage.advance(qualified, context);
        } else {
            nextContext = stage.advance?.(qualified, context) ?? {};
        }

        uefaStorage.setPhaseContext(competition, nextContext);

        archiveCurrentPhase();
        currentUEFAPhase = nextStage.phase;
        fixtures = generateStageFixtures(nextStage, teams, nextContext);

        uefaStorage.setPhase(competition, currentUEFAPhase);
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

    /**
     * Use the saved group draw, if any; otherwise the format's own draw.
     */
    function applySavedDraw(): void {
        format = baseFormat;
        const groupStage = baseFormat.stages.find((s) => s.kind === "groups");
        if (!groupStage || groupStage.kind !== "groups") return;

        const saved = uefaStorage.getGroups(competition);
        if (isValidDraw(saved, Object.keys(groupStage.groups), teams)) {
            format = withGroups(baseFormat, saved);
        }
    }

    /**
     * Draw new groups from the seeding pots, if this format has them.
     */
    function redrawGroups(): void {
        format = baseFormat;
        const groupStage = baseFormat.stages.find((s) => s.kind === "groups");
        if (!groupStage || groupStage.kind !== "groups" || !groupStage.pots) {
            return;
        }

        const groups = drawGroups(
            groupStage.pots,
            Object.keys(groupStage.groups).sort(),
            groupStage.drawRules ?? {},
        );
        uefaStorage.setGroups(competition, groups);
        format = withGroups(baseFormat, groups);
    }

    function init(): void {
        teams = getUEFATeams(competition);
        applySavedDraw();
        initializeFixtures();
        recalcTable();
        renderAllFixtures();
    }

    function regenerate(): void {
        uefaStorage.clearAll(competition);
        redrawGroups();

        currentUEFAPhase = format.stages[0]!.phase;
        history = [];
        viewedHistoryPhase = null;
        fixtures = generateStageFixtures(
            format.stages[0]!,
            shuffleArray(teams),
            {},
        );

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
        });
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
        resetStandingsView();
        table = {};
        fixtures = [];
        teams = [];
        history = [];
        viewedHistoryPhase = null;
    }

    return { init, save, reset, regenerate, destroy };
}
