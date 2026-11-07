import type { Match, KnockoutMatch, MatchUpdate } from "../interfaces/match.js";
import type { LeaguePhase, Round } from "../interfaces/round.js";
import type { Table, TableRow } from "../interfaces/table.js";
import type {
    TournamentKey,
    Teams,
    Phase,
    StageContext,
    CompetitionApp,
    StageHistoryEntry,
} from "../interfaces/tournament.js";

import type { TournamentStorage } from "./storage.js";
import { getFormat } from "../competitions.js";
import {
    renderPhaseProgressionButtons,
    renderStageFixtures,
    renderHistoryControls,
    renderLeagueTable,
    renderGroupTables,
    resetStandingsView,
} from "./ui.js";
import { sortLeagueStageTable } from "./league-table.js";
import { applyMatchResult, initTable, removeMatchResult } from "../utils/table.js";
import { countTies, getKnockoutWinners } from "../utils/knockout.js";
import {
    generateStageFixtures,
    withGroups,
    getNextStage,
    getPhaseLabel,
    getStage,
} from "./format.js";
import { shuffleArray } from "../utils/shuffle.js";
import {
    type RatingOf,
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

/**
 * What a tournament app runs on: its teams (seeding order), where it saves,
 * and how strong each team is in simulations. Differs between Classic and Career.
 */
export interface TournamentContext {
    id: TournamentKey;
    teams: Teams;
    rosterVersion: string | null;
    storage: TournamentStorage;
    ratingOf: RatingOf;
}

/**
 * Create the app for a stage-based tournament (club or national).
 */
export function createTournamentApp(ctx: TournamentContext): CompetitionApp {
    const selectedComp = ctx.id;
    const storage = ctx.storage;
    const baseFormat = getFormat(selectedComp);
    let format = baseFormat;
    let fixtures: Round[] = [];
    let table: Table = {};
    const competition: TournamentKey = selectedComp;
    let teams: Teams = [];
    let currentPhase: Phase = "league";
    let history: StageHistoryEntry[] = [];
    let viewedHistoryPhase: Phase | null = null;

    function currentStageKind() {
        return getStage(format, currentPhase)?.kind;
    }

    function leagueZones() {
        const stage = getStage(format, currentPhase);
        return stage?.kind === "league" ? (stage.zones ?? []) : [];
    }

    function renderGroupStandings(): void {
        const stage = getStage(format, currentPhase);
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
            table = initTable(teams);
            (fixtures as LeaguePhase).forEach((round: Round) =>
                round.matches.forEach(function (match: Match) {
                    applyMatchResult(match, table);
                }),
            );
            renderLeagueTable(table, true, fixtures as LeaguePhase, leagueZones());
        } else {
            renderLeagueTable({}, false);
        }
    }

    /**
     * Update the league-stage standings incrementally.
     */
    function updateTableIncrementally(updates: MatchUpdate[]): void {
        if (currentStageKind() === "groups") {
            // Four-team groups are cheap to rebuild from scratch
            renderGroupStandings();
        } else if (currentStageKind() === "league") {
            updates.forEach((update) => {
                removeMatchResult(update.oldMatch, table);
                applyMatchResult(update.match, table);
            });
            renderLeagueTable(table, true, fixtures as LeaguePhase, leagueZones());
        }
    }

    /**
     * Load fixtures from storage or generate fresh ones.
     */
    function initializeFixtures(): void {
        const rosterVersion = ctx.rosterVersion;
        currentPhase =
            storage.getPhase(competition) || format.stages[0]!.phase;
        let structure = storage.getFixturesStructure(
            competition,
            rosterVersion,
        );

        // A stored phase this format doesn't know means stale data: start over
        if (!getStage(format, currentPhase)) {
            storage.clearAll(competition);
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
            currentPhase = format.stages[0]!.phase;
            fixtures = generateStageFixtures(format.stages[0]!, teams, {});

            storage.setFixturesStructure(
                fixtures,
                competition,
                rosterVersion,
            );
            storage.setPhase(competition, currentPhase);
        }

        // Merge saved results
        try {
            const savedFixtures = storage.getFixtures(
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

        history = storage.getHistory(competition, rosterVersion);
    }

    /**
     * Render all fixtures for the current stage.
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
            : currentPhase;
        const readOnly =
            Boolean(historyEntry) || currentPhase === "finished";

        const onResultsApplied = function (updates: MatchUpdate[]) {
            updateTableIncrementally(updates);
            storage.setFixturesDebounced(
                fixtures as Round[],
                competition,
                ctx.rosterVersion,
            );
            if (currentStageKind() === "knockout") {
                renderAllFixtures();
            }
        };

        const displayedStage = getStage(format, displayedPhase);
        if (!displayedStage) return;

        renderStageFixtures(
            displayedFixtures,
            onResultsApplied,
            displayedStage,
            (readOnly ? "Viewing completed phase: " : "Current Phase: ") +
                getPhaseLabel(format, displayedPhase),
            readOnly,
            simulate,
        );

        renderHistoryControls(
            history,
            (phase: Phase) => getPhaseLabel(format, phase),
            currentPhase,
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

        if (!readOnly && currentPhase !== "finished") {
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
        if (viewedHistoryPhase || currentPhase === "finished") return;

        const stage = getStage(format, currentPhase);
        if (!stage) return;

        const rounds = fixtures;
        const ratingOf = ctx.ratingOf;
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
        storage.setFixturesDebounced(
            rounds,
            competition,
            ctx.rosterVersion,
        );

        if (stage.kind !== "knockout") {
            syncScoreInputs(rounds, roundIndices);
        } else {
            // Re-render to show aggregates and penalty shootouts
            renderAllFixtures();
        }
    }

    function archiveCurrentPhase(): void {
        const rosterVersion = ctx.rosterVersion;
        storage.archivePhase(
            competition,
            currentPhase,
            fixtures as Round[],
            rosterVersion,
        );
        history = storage.getHistory(competition, rosterVersion);
    }

    /**
     * Complete the current stage and move on to the next one, or crown the
     * champion when the last stage is done.
     */
    function progressPhase(): void {
        const rounds = fixtures as Round[];
        const stage = getStage(format, currentPhase);
        if (!stage || currentPhase === "finished") return;

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
            qualified = sortLeagueStageTable(table).map((row: TableRow) => row.team);
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

        const nextStage = getNextStage(format, currentPhase);

        if (!nextStage) {
            alert(qualified[0] + " wins the competition! 🏆");

            archiveCurrentPhase();
            storage.setFixturesImmediate(
                rounds,
                competition,
                ctx.rosterVersion,
            );
            currentPhase = "finished";
            storage.setPhase(competition, "finished");

            recalcTable();
            renderAllFixtures();
            return;
        }

        const context: StageContext =
            storage.getPhaseContext(competition) || {};
        let nextContext: StageContext;
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

        storage.setPhaseContext(competition, nextContext);

        archiveCurrentPhase();
        currentPhase = nextStage.phase;
        fixtures = generateStageFixtures(nextStage, teams, nextContext);

        storage.setPhase(competition, currentPhase);
        storage.setFixturesStructure(
            fixtures as Round[],
            competition,
            ctx.rosterVersion,
        );
        storage.setFixturesImmediate(
            fixtures as Round[],
            competition,
            ctx.rosterVersion,
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

        const saved = storage.getGroups(competition);
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
        storage.setGroups(competition, groups);
        format = withGroups(baseFormat, groups);
    }

    function init(): void {
        teams = ctx.teams;
        applySavedDraw();
        initializeFixtures();
        recalcTable();
        renderAllFixtures();
    }

    function regenerate(): void {
        storage.clearAll(competition);
        redrawGroups();

        currentPhase = format.stages[0]!.phase;
        history = [];
        viewedHistoryPhase = null;
        fixtures = generateStageFixtures(
            format.stages[0]!,
            shuffleArray(teams),
            {},
        );

        storage.setPhase(competition, currentPhase);
        storage.setFixturesStructure(
            fixtures,
            competition,
            ctx.rosterVersion,
        );

        recalcTable();
        renderAllFixtures();
    }

    function save(): void {
        storage.setFixturesImmediate(
            fixtures as Round[],
            competition,
            ctx.rosterVersion,
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
        storage.setFixturesImmediate(
            fixtures as Round[],
            competition,
            ctx.rosterVersion,
        );
    }

    function destroy(): void {
        storage.cancelPendingSave(competition);
        resetStandingsView();
        table = {};
        fixtures = [];
        teams = [];
        history = [];
        viewedHistoryPhase = null;
    }

    return { init, save, reset, regenerate, destroy };
}
