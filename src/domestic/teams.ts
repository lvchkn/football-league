import type { League, LeagueList, Teams } from "../interfaces/tournament.js";

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

const championship: League = {
    key: "english-2",
    name: "English Championship",
    teams: [
        "Birmingham City",
        "Blackburn Rovers",
        "Bristol City",
        "Charlton Athletic",
        "Coventry City",
        "Derby County",
        "Hull City",
        "Ipswich Town",
        "Leicester City",
        "Middlesbrough",
        "Millwall",
        "Norwich City",
        "Oxford United",
        "Portsmouth",
        "Preston North End",
        "Queens Park Rangers",
        "Sheffield United",
        "Sheffield Wednesday",
        "Southampton",
        "Stoke City",
        "Swansea City",
        "Watford",
        "West Bromwich Albion",
        "Wrexham",
    ],
};

const serieB: League = {
    key: "italian-2",
    name: "Italian Serie B",
    teams: [
        "Avellino",
        "Bari",
        "Carrarese",
        "Catanzaro",
        "Cesena",
        "Empoli",
        "Frosinone",
        "Juve Stabia",
        "Mantova",
        "Modena",
        "Monza",
        "Padova",
        "Palermo",
        "Pescara",
        "Reggiana",
        "Sampdoria",
        "Spezia",
        "Südtirol",
        "Venezia",
        "Virtus Entella",
    ],
};

const segunda: League = {
    key: "spanish-2",
    name: "Spanish Segunda División",
    teams: [
        "Albacete",
        "Almería",
        "Burgos",
        "Cádiz",
        "Castellón",
        "Ceuta",
        "Córdoba",
        "Cultural Leonesa",
        "Deportivo La Coruña",
        "Eibar",
        "FC Andorra",
        "Granada",
        "Huesca",
        "Las Palmas",
        "Leganés",
        "Málaga",
        "Mirandés",
        "Racing Santander",
        "Real Sociedad B",
        "Real Valladolid",
        "Real Zaragoza",
        "Sporting Gijón",
    ],
};

const bundesliga2: League = {
    key: "german-2",
    name: "German Bundesliga 2",
    teams: [
        "Arminia Bielefeld",
        "VfL Bochum",
        "Eintracht Braunschweig",
        "Darmstadt 98",
        "Dynamo Dresden",
        "Fortuna Düsseldorf",
        "SV Elversberg",
        "Greuther Fürth",
        "Hannover 96",
        "Hertha BSC",
        "1. FC Kaiserslautern",
        "Karlsruher SC",
        "Holstein Kiel",
        "1. FC Magdeburg",
        "Preußen Münster",
        "1. FC Nürnberg",
        "SC Paderborn",
        "Schalke 04",
    ],
};

const ligue2: League = {
    key: "french-2",
    name: "French Ligue 2",
    teams: [
        "Amiens",
        "Annecy",
        "Bastia",
        "Boulogne",
        "Dunkerque",
        "Guingamp",
        "Laval",
        "Le Mans",
        "Montpellier",
        "Nancy",
        "Pau FC",
        "Red Star",
        "Reims",
        "Rodez",
        "Saint-Étienne",
        "Grenoble",
        "Troyes",
        "Valenciennes",
    ],
};

/**
 * Get teams by league name.
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
        case championship.key:
            return championship.teams;
        case serieB.key:
            return serieB.teams;
        case segunda.key:
            return segunda.teams;
        case bundesliga2.key:
            return bundesliga2.teams;
        case ligue2.key:
            return ligue2.teams;
        default:
            return [];
    }
}
