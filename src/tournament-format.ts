import type { Round } from "./interfaces/round.js";
import type {
    Phase,
    Stage,
    Teams,
    TournamentFormat,
    UEFAContext,
} from "./interfaces/tournament.js";
import { generateKnockoutRound } from "./utils/knockout.js";

/**
 * The stage for a phase. "finished" resolves to the last stage, whose
 * fixtures stay on screen once the competition is over.
 */
export function getStage(format: TournamentFormat, phase: Phase): Stage | undefined {
    if (phase === "finished") return format.stages[format.stages.length - 1];
    return format.stages.find((stage) => stage.phase === phase);
}

export function getNextStage(format: TournamentFormat, phase: Phase): Stage | undefined {
    const index = format.stages.findIndex((stage) => stage.phase === phase);
    return index === -1 ? undefined : format.stages[index + 1];
}

export function getPhaseLabel(format: TournamentFormat, phase: Phase): string {
    if (phase === "finished") return "Finished";
    return getStage(format, phase)?.label ?? phase;
}

/**
 * Fixtures for entering a stage: league stages are drawn from the full
 * roster, knockout stages from the context built by the previous stage.
 */
export function generateStageFixtures(
    stage: Stage,
    teams: Teams,
    context: UEFAContext,
): Round[] {
    if (stage.kind === "league") return stage.generate(teams);
    return [generateKnockoutRound(stage.pairings(context), stage.legs)];
}
