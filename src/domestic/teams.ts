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
        "Sunderland",
        "Ipswich Town",
        "Hull City",
        "Coventry City",
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
        "Lorient",
        "Le Mans",
        "Paris FC",
        "Troyes",
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
        "Elversberg",
        "Eintracht Frankfurt",
        "1. FC Köln",
        "Hamburg SV",
        "Borussia Mönchengladbach",
        "Mainz 05",
        "FC Augsburg",
        "Werder Bremen",
        "Paderborn 07",
        "Schalke 04",
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
        "Venezia",
        "Lazio",
        "Atalanta",
        "Fiorentina",
        "Sassuolo",
        "Udinese",
        "Bologna",
        "Cagliari",
        "Monza",
        "Genoa",
        "Parma",
        "Torino",
        "Lecce",
        "Frosinone",
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
        "Malaga",
        "Getafe",
        "Valencia",
        "Elche",
        "Deportivo La Coruña",
        "Alavés",
        "Rayo Vallecano",
        "Racing",
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
        "Willem II",
        "Cambuur",
        "ADO Den Haag",
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
        "Royale Union Saint-Gilloise",
        "Westerlo",
        "Lommel SK",
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
        "Mladost Lučani",
        "Zeleznicar",
        "Novi Pazar",
        "IMT",
        "OFK",
        "Zemun",
        "Mačva Šabac",
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
        "Orenburg",
        "Krylia Sovetov",
        "Akhmat",
        "Akron",
        "Fakel",
        "Rodina",
        "Baltika",
        "Dynamo Makhachkala",
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
        "Panetolikos",
        "Asteras Tripolis",
        "Kifisia",
        "Levadiakos",
        "Iraklis",
        "Kalamata",
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
        "Gaziantep FK",
        "Kasımpaşa",
        "Eyüpspor",
        "Gençlerbirliği",
        "Rizespor",
        "Kocaelispor",
        "Samsunspor",
        "Erzurumspor",
        "Çorum",
        "Amedspor",
    ],
};

const championship: League = {
    key: "english-2",
    name: "English Championship",
    teams: [
        "Blackburn Rovers",
        "Bristol City",
        "Charlton Athletic",
        "Coventry City",
        "Derby County",
        "Middlesbrough",
        "Millwall",
        "Norwich City",
        "Portsmouth",
        "Preston North End",
        "Queens Park Rangers",
        "Sheffield United",
        "Southampton",
        "Stoke City",
        "Swansea City",
        "Watford",
        "West Bromwich Albion",
        "Wrexham",
        "Lincoln City",
        "Cardiff City",
        "Bolton Wanderers",
        "Burnley",
        "Wolverhampton",
        "West Ham United",
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
        "Juve Stabia",
        "Mantova",
        "Modena",
        "Padova",
        "Palermo",
        "Sampdoria",
        "Südtirol",
        "Virtus Entella",
        "Cremonese",
        "Verona",
        "Pisa",
        "Vicenza",
        "Benevento",
        "Ascoli",
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
        "Eibar",
        "FC Andorra",
        "Granada",
        "Las Palmas",
        "Leganés",
        "Mirandés",
        "Real Sociedad B",
        "Real Valladolid",
        "Sporting Gijón",
        "Real Oviedo",
        "Girona",
        "Mallorca",
        "Sabadell",
        "Tenerife",
        "Eldense",
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
        "Greuther Fürth",
        "Hannover 96",
        "Hertha BSC",
        "1. FC Kaiserslautern",
        "Karlsruher SC",
        "Holstein Kiel",
        "1. FC Magdeburg",
        "1. FC Nürnberg",
        "Wolfsburg",
        "Sankt Pauli",
        "Heidenheim",
        "Energie Cottbus",
        "Osnabrück",
    ],
};

const ligue2: League = {
    key: "french-2",
    name: "French Ligue 2",
    teams: [
        "Annecy",
        "Boulogne",
        "Dunkerque",
        "Guingamp",
        "Laval",
        "Montpellier",
        "Nancy",
        "Pau FC",
        "Red Star",
        "Reims",
        "Rodez",
        "Saint-Étienne",
        "Grenoble",
        "Clermont",
        "Nantes",
        "Metz",
        "Sochaux",
        "Dijon",
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
