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

// const clTeams = Array.from({ length: 36 }, (_, i) => `CL Team ${i + 1}`);

// const clTeams: Teams = [
//     // Pot 1

//     "AEK Athens",

//     "Fiorentina",

//     "Mainz",

//     "Raków Częstochowa",

//     "Sparta Praha",

//     "Strasbourg",

//     // Pot 2

//     "AZ Alkmaar",

//     "Crystal Palace",

//     "Dynamo Kyiv",

//     "Rayo Vallecano",

//     "Shakhtar Donetsk",

//     "Slovan Bratislava",

//     // Pot 3

//     "AEK Larnaca",

//     "Celje",

//     "Jagiellonia Białystok",

//     "Lech Poznań",

//     "Legia Warszawa",

//     "Rijeka",

//     // Pot 4

//     "Drita",

//     "KuPS Kuopio",

//     "Lausanne-Sport",

//     "Noah",

//     "Omonoia",

//     "Shkëndija",

//     // Pot 5

//     "Aberdeen",

//     "Breiðablik",

//     "Häcken",

//     "Hamrun Spartans",

//     "Samsunspor",

//     "Sigma Olomouc",

//     // Pot 6

//     "Lincoln Red Imps",

//     "Shamrock Rovers",

//     "Shelbourne",

//     "SK Rapid",

//     "Universitatea Craiova",

//     "Zrinjski",
// ];

const clTeams: Teams = [
    // Historic giants currently slumming it
    "Fiorentina",
    "Roma",
    "Aston Villa",
    "West Ham United",
    "RSC Anderlecht",
    "Olympiacos", // actual UECL winners 2024

    // Eastern European flavor (cult level, not superclubs)
    "Legia Warszawa",
    "Jagiellonia Białystok",
    "Lech Poznań",
    "Ferencváros",
    "Čukarički", // Serbian underdog regulars
    "Zrinjski Mostar", // first Bosnian club ever in group stage

    // Scandinavian representatives
    "Malmö FF",
    "Brøndby IF",
    "Rosenborg",
    "Häcken",
    "Bodø/Glimt",
    "KÍ Klaksvík", // first ever Faroese club in group stage, part-timers with day jobs

    // Portuguese & Spanish flavor
    "Vitória SC",
    "Rayo Vallecano",
    "Celta Vigo",
    "Panathinaikos",
    "PAOK",
    "Omonoia",

    // Dutch & Belgian charm
    "AZ Alkmaar",
    "Go Ahead Eagles",
    "Utrecht",
    "Gent",
    "Genk",
    "Beerschot", // Antwerp derby chaos club, yo-yo between divisions

    // Wildcard underdogs & cult clubs
    "Shamrock Rovers",
    "Aberdeen",
    "Larne", // first Northern Irish club to host a home group stage match
    "Breiðablik", // first Icelandic club ever in group stage
    "Hamrun Spartans", // first Maltese club ever in league phase
    "Lincoln Red Imps", // Gibraltar minnows, perennial qualifiers
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
