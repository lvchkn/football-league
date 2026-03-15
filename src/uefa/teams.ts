/**
 * UEFA Competitions: Teams for Swiss Stage (36 teams each)
 */

interface TeamsByCompetition {
    [key: string]: string[];
}

export type UEFACompetition = "ucl" | "el" | "cl";
export type Teams = string[];

const uclTeams: Teams = [
    // Pot 1
    "Paris Saint-Germain",
    "Real Madrid",
    "Manchester City",
    "Bayern München",
    "Liverpool",
    "Inter",
    "Chelsea",
    "Borussia Dortmund",
    "Barcelona",

    // Pot 2
    "Arsenal",
    "Bayer Leverkusen",
    "Atlético de Madrid",
    "Benfica",
    "Atalanta",
    "Villarreal",
    "Juventus",
    "Eintracht Frankfurt",
    "Club Brugge",

    // Pot 3
    "Tottenham Hotspur",
    "Newcastle United",
    "Monaco",
    "Sporting",
    "Ajax",
    "Olympiacos",
    "Marseille",
    "PSV Eindhoven",
    "Napoli",

    // Pot 4
    "Athletic Club",
    "Galatasaray",
    "Copenhagen",
    "Slavia Praha",
    "Pafos",
    "Qarabağ",
    "Union Saint-Gilloise",
    "Bodø/Glimt",
    "Kairat Almaty",
];

const elTeams: Teams = [
    // Pot 1
    "Roma",
    "Porto",
    "Rangers",
    "Feyenoord",
    "Lille",
    "Dinamo Zagreb",
    "Real Betis",
    "Red Bull Salzburg",
    "Aston Villa",

    // Pot 2
    "Fenerbahçe",
    "Braga",
    "Red Star Belgrade",
    "Lyon",
    "PAOK",
    "Viktoria Plzeň",
    "Ferencváros",
    "Celtic",
    "Maccabi Tel Aviv",

    // Pot 3
    "Young Boys",
    "Basel",
    "Midtjylland",
    "Freiburg",
    "Ludogorets",
    "Nottingham Forest",
    "Sturm Graz",
    "FCSB",
    "Nice",

    // Pot 4
    "Bologna",
    "Celta Vigo",
    "VfB Stuttgart",
    "Panathinaikos",
    "Malmö FF",
    "Go Ahead Eagles",
    "Utrecht",
    "Genk",
    "Brann",
];

const clTeams = Array.from({ length: 36 }, (_, i) => `CL Team ${i + 1}`);

const uefaTeamsByCompetition: TeamsByCompetition = {
    ucl: uclTeams,
    el: elTeams,
    cl: clTeams,
};

/**
 * Get teams for a specific UEFA competition
 * @param {UEFACompetition} competition - "ucl", "el", or "cl"
 * @return {Teams} - array of team names
 */
export function getUEFATeams(competition: UEFACompetition): Teams {
    return uefaTeamsByCompetition[competition] || [];
}
