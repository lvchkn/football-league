import type { Teams } from "../interfaces/tournament.js";

export function computeRosterVersion(teams: Teams): string | null {
    if (!teams.length) return null;

    let hash = 0;

    teams.forEach((team) => {
        for (let index = 0; index < team.length; index += 1) {
            hash = (hash * 31 + team.charCodeAt(index)) >>> 0;
        }
        hash = (hash * 31 + 17) >>> 0;
    });

    return hash.toString(16);
}
