import type {
    Teams,
    TeamsByCompetition,
    UEFACompetition,
} from "../interfaces/tournament.js";

/**
 * UEFA Competitions: Teams for Swiss Stage (36 teams each)
 */
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

const clTeams: Teams = [
    "Fiorentina",
    "Roma",
    "Aston Villa",
    "West Ham United",
    "RSC Anderlecht",
    "Olympiacos",

    "Legia Warszawa",
    "Jagiellonia Białystok",
    "Lech Poznań",
    "Ferencváros",
    "Čukarički",
    "Zrinjski Mostar",

    "Malmö FF",
    "Brøndby IF",
    "Rosenborg",
    "Häcken",
    "Bodø/Glimt",
    "KÍ Klaksvík",

    "Vitória SC",
    "Rayo Vallecano",
    "Celta Vigo",
    "Panathinaikos",
    "PAOK",
    "Omonoia",

    "AZ Alkmaar",
    "Go Ahead Eagles",
    "Utrecht",
    "Gent",
    "Genk",
    "Beerschot",

    "Shamrock Rovers",
    "Aberdeen",
    "Larne",
    "Breiðablik",
    "Hamrun Spartans",
    "Lincoln Red Imps",
];

const uefaTeamsByCompetition: TeamsByCompetition = {
    ucl: uclTeams,
    el: elTeams,
    cl: clTeams,
};

/**
 * Get teams for a specific UEFA competition
 */
export function getUEFATeams(competition: UEFACompetition): Teams {
    return uefaTeamsByCompetition[competition] || [];
}
