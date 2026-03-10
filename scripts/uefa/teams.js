window.FootballLeague = window.FootballLeague || {};
window.FootballLeague.UEFA = window.FootballLeague.UEFA || {};

/**
 * UEFA Competitions: Teams for Swiss Stage (36 teams each)
 * Using placeholder names for now (Team 1, Team 2, etc.)
 */

const uclTeams = Array.from({ length: 36 }, (_, i) => `UCL Team ${i + 1}`);
const elTeams = Array.from({ length: 36 }, (_, i) => `EL Team ${i + 1}`);
const clTeams = Array.from({ length: 36 }, (_, i) => `CL Team ${i + 1}`);

const uefaTeamsByCompetition = {
    ucl: uclTeams,
    el: elTeams,
    cl: clTeams,
};

/**
 * Get teams for a specific UEFA competition
 * @param {string} competition - "ucl", "el", or "cl"
 * @return {Array<string>} - array of team names
 */
function getUEFATeams(competition) {
    return uefaTeamsByCompetition[competition] || [];
}

window.FootballLeague.UEFA.getTeams = getUEFATeams;
