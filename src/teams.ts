import type { Teams } from "./uefa/teams.js";

export type LeagueList =
    | "english"
    | "french"
    | "german"
    | "italian"
    | "spanish"
    | "russian"
    | "dutch"
    | "belgian"
    | "serbian"
    | "greek"
    | "turkish";

export interface League {
    key: LeagueList;
    name: string;
    teams: Teams;
}

const englishLeague: League = {
    key: "english",
    name: "English Premier League",
    teams: [
        "Arsenal",
        "Aston Villa",
        "Bournemouth",
        "Brentford",
        "Brighton",
        "Chelsea",
        "Crystal Palace",
        "Everton",
        "Fulham",
        "Leeds",
        "Liverpool",
        "Manchester City",
        "Manchester United",
        "Newcastle",
        "Nottingham Forest",
        "Tottenham",
        "West Ham",
        "Sunderland",
        "Burnley",
        "Wolverhampton",
    ],
};

const frenchLeague: League = {
    key: "french",
    name: "French Ligue 1",
    teams: [
        "Paris Saint-Germain",
        "Marseille",
        "Monaco",
        "Lyon",
        "Lille",
        "Rennes",
        "Nice",
        "Brest",
        "Le Havre",
        "Strasbourg",
        "Angers",
        "Lens",
        "Toulouse",
        "Auxerre",
        "Nantes",
        "Metz",
        "Lorient",
        "Paris FC",
    ],
};

const germanLeague: League = {
    key: "german",
    name: "German Bundesliga",
    teams: [
        "Bayern Munich",
        "Borussia Dortmund",
        "Hoffenheim",
        "RB Leipzig",
        "VfB Stuttgart",
        "Bayer Leverkusen",
        "SC Freiburg",
        "Union Berlin",
        "Eintracht Frankfurt",
        "1. FC Köln",
        "Hamburg SV",
        "Borussia Mönchengladbach",
        "Mainz 05",
        "FC Augsburg",
        "VfL Wolfsburg",
        "Werder Bremen",
        "Sankt Pauli",
        "Heidenheim",
    ],
};

const italianLeague: League = {
    key: "italian",
    name: "Italian Serie A",
    teams: [
        "Inter Milan",
        "AC Milan",
        "Napoli",
        "Juventus",
        "Roma",
        "Como",
        "Lazio",
        "Atalanta",
        "Fiorentina",
        "Sassuolo",
        "Udinese",
        "Bologna",
        "Cagliari",
        "Cremonese",
        "Genoa",
        "Parma",
        "Torino",
        "Lecce",
        "Verona",
        "Pisa",
    ],
};

const spanishLeague: League = {
    key: "spanish",
    name: "Spanish La Liga",
    teams: [
        "Real Madrid",
        "Barcelona",
        "Atlético Madrid",
        "Sevilla",
        "Real Sociedad",
        "Villarreal",
        "Real Betis",
        "Celta Vigo",
        "Espanyol",
        "Athletic Bilbao",
        "Osasuna",
        "Girona",
        "Getafe",
        "Valencia",
        "Mallorca",
        "Elche",
        "Alavés",
        "Rayo Vallecano",
        "Real Oviedo",
        "Levante",
    ],
};

const dutchLeague: League = {
    key: "dutch",
    name: "Dutch Eredivisie",
    teams: [
        "Ajax",
        "PSV Eindhoven",
        "Feyenoord",
        "AZ Alkmaar",
        "Heracles Almelo",
        "Utrecht",
        "Twente",
        "Heerenveen",
        "Groningen",
        "Sparta Rotterdam",
        "PEC Zwolle",
        "Fortuna Sittard",
        "NEC Nijmegen",
        "Excelsior Rotterdam",
        "Telstar",
        "Go Ahead Eagles",
        "NAC Breda",
        "Volendam",
    ],
};

const belgianLeague: League = {
    key: "belgian",
    name: "Belgian Pro League",
    teams: [
        "Club Brugge",
        "RSC Anderlecht",
        "KAA Gent",
        "Standard Liège",
        "KRC Genk",
        "Royal Antwerp",
        "Charleroi",
        "KV Mechelen",
        "St. Truiden",
        "Zulte Waregem",
        "Cercle Brugge",
        "Oud-Heverlee Leuven",
        "RAAL La Louvière",
        "Dender",
        "Royale Union Saint-Gilloise",
        "Westerlo",
    ],
};

const serbianLeague: League = {
    key: "serbian",
    name: "Serbian SuperLiga",
    teams: [
        "Crvena Zvezda",
        "Partizan",
        "Vojvodina",
        "Čukarički",
        "Radnički Niš",
        "Radnik Surdulica",
        "Radnički Kragujevac",
        "Spartak Subotica",
        "Mladost Lučani",
        "Zeleznicar",
        "Novi Pazar",
        "IMT",
        "Napredak Kruševac",
        "Javor Ivanjica",
        "TSC Bačka Topola",
        "OFK",
    ],
};

const russianLeague: League = {
    key: "russian",
    name: "Russian Premier League",
    teams: [
        "Zenit Saint Petersburg",
        "CSKA Moscow",
        "Spartak Moscow",
        "Lokomotiv Moscow",
        "Krasnodar",
        "Dynamo Moscow",
        "Rostov",
        "Rubin Kazan",
        "Ufa",
        "Orenburg",
        "Sochi",
        "Nizhny Novgorod",
        "Khimki",
        "Arsenal Tula",
        "Tambov",
        "Yenisey Krasnoyarsk",
        "Rotor Volgograd",
        "Krylia Sovetov",
        "Torpedo Moscow",
        "Shinnik Yaroslavl",
    ],
};

const greekLeague: League = {
    key: "greek",
    name: "Greek Super League",
    teams: [
        "Olympiacos",
        "Panathinaikos",
        "AEK Athens",
        "PAOK",
        "Aris Thessaloniki",
        "Atromitos",
        "OFI Crete",
        "Volos",
        "AE Larissa",
        "Panetolikos",
        "Asteras Tripolis",
        "Panserraikos",
        "Kifisia",
        "Levadiakos",
    ],
};

const turkishLeague: League = {
    key: "turkish",
    name: "Turkish Süper Lig",
    teams: [
        "Galatasaray",
        "Fenerbahçe",
        "Beşiktaş",
        "Trabzonspor",
        "Başakşehir",
        "Konyaspor",
        "Alanyaspor",
        "Göztepe",
        "Antalyaspor",
        "Kayserispor",
        "Gaziantep FK",
        "Kasımpaşa",
        "Eyüpspor",
        "Karagümrük",
        "Gençlerbirliği",
        "Rizespor",
        "Kocaelispor",
        "Samsunspor",
    ],
};

/**
 * Get teams by league name.
 * @param {string} league - The name of the league.
 * @returns {Teams} An array of team names in the specified league.
 */
export function getTeamsByLeague(league: LeagueList): Teams {
    switch (league) {
        case englishLeague.key:
            return englishLeague.teams;
        case frenchLeague.key:
            return frenchLeague.teams;
        case germanLeague.key:
            return germanLeague.teams;
        case italianLeague.key:
            return italianLeague.teams;
        case spanishLeague.key:
            return spanishLeague.teams;
        case russianLeague.key:
            return russianLeague.teams;
        case dutchLeague.key:
            return dutchLeague.teams;
        case belgianLeague.key:
            return belgianLeague.teams;
        case serbianLeague.key:
            return serbianLeague.teams;
        case greekLeague.key:
            return greekLeague.teams;
        case turkishLeague.key:
            return turkishLeague.teams;
        default:
            return [];
    }
}
