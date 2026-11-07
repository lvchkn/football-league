/**
 * Every competition the app offers. Adding one means adding its id to
 * LeagueList or TournamentKey and an entry here; the type checker flags
 * whichever half is missing, and the league dropdown is built from this list.
 */
import type {
    LeagueList,
    Teams,
    TournamentFormat,
    TournamentKey,
} from "./interfaces/tournament.js";
import * as domestic from "./domestic/teams.js";
import { EURO_2024_FORMAT, EURO_2024_TEAMS } from "./national/euro2024.js";
import { WC_2026_FORMAT, WC_2026_TEAMS } from "./national/worldcup2026.js";
import { UEFA_FORMAT } from "./uefa/format.js";
import { clTeams, elTeams, uclTeams } from "./uefa/teams.js";
import { computeRosterVersion } from "./utils/roster-version.js";

export type CompetitionId = LeagueList | TournamentKey;

interface CompetitionInfo {
    name: string;
    /** Dropdown section. */
    group: string;
    /** Seeding order (strongest first) where it matters. */
    teams: Teams;
}

interface TournamentInfo extends CompetitionInfo {
    format: TournamentFormat;
}

const TOP = "Domestic Leagues";
const TIER_2 = "Domestic Tier 2 Leagues";
const UEFA = "UEFA Competitions";
const NATIONAL = "National Teams";

function league(source: { name: string; teams: Teams }, group: string): CompetitionInfo {
    return { name: source.name, group, teams: source.teams };
}

/** Domestic leagues, in dropdown order. */
export const DOMESTIC_LEAGUES: Record<LeagueList, CompetitionInfo> = {
    english: league(domestic.englishLeague, TOP),
    spanish: league(domestic.spanishLeague, TOP),
    italian: league(domestic.italianLeague, TOP),
    german: league(domestic.germanLeague, TOP),
    french: league(domestic.frenchLeague, TOP),
    dutch: league(domestic.dutchLeague, TOP),
    belgian: league(domestic.belgianLeague, TOP),
    russian: league(domestic.russianLeague, TOP),
    serbian: league(domestic.serbianLeague, TOP),
    greek: league(domestic.greekLeague, TOP),
    turkish: league(domestic.turkishLeague, TOP),
    "english-2": league(domestic.championship, TIER_2),
    "spanish-2": league(domestic.segunda, TIER_2),
    "italian-2": league(domestic.serieB, TIER_2),
    "german-2": league(domestic.bundesliga2, TIER_2),
    "french-2": league(domestic.ligue2, TIER_2),
};

/** Stage-based tournaments, in dropdown order. */
export const TOURNAMENTS: Record<TournamentKey, TournamentInfo> = {
    ucl: { name: "UEFA Champions League", group: UEFA, teams: uclTeams, format: UEFA_FORMAT },
    el: { name: "UEFA Europa League", group: UEFA, teams: elTeams, format: UEFA_FORMAT },
    cl: { name: "UEFA Conference League", group: UEFA, teams: clTeams, format: UEFA_FORMAT },
    wc: { name: "FIFA World Cup 2026", group: NATIONAL, teams: WC_2026_TEAMS, format: WC_2026_FORMAT },
    euro: { name: "UEFA Euro 2024", group: NATIONAL, teams: EURO_2024_TEAMS, format: EURO_2024_FORMAT },
};

/** All competitions in dropdown order. */
export const COMPETITIONS: [CompetitionId, CompetitionInfo][] = [
    ...(Object.entries(DOMESTIC_LEAGUES) as [LeagueList, CompetitionInfo][]),
    ...(Object.entries(TOURNAMENTS) as [TournamentKey, TournamentInfo][]),
];

export function isTournament(id: string): id is TournamentKey {
    return Object.hasOwn(TOURNAMENTS, id);
}

export function isCompetition(id: string): id is CompetitionId {
    return isTournament(id) || Object.hasOwn(DOMESTIC_LEAGUES, id);
}

export function getTeams(id: CompetitionId): Teams {
    return (isTournament(id) ? TOURNAMENTS[id] : DOMESTIC_LEAGUES[id as LeagueList])?.teams ?? [];
}

export function getFormat(id: TournamentKey): TournamentFormat {
    return TOURNAMENTS[id].format;
}

/**
 * Fingerprint of a competition's team list. Saved progress made with a
 * different list is discarded.
 */
export function getRosterVersion(id: CompetitionId): string | null {
    const teams = getTeams(id);
    return teams.length ? computeRosterVersion(teams) : null;
}
