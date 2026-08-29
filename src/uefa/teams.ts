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
    "Bayern München",
    "Real Madrid",
    "Liverpool",
    "Inter",
    "Manchester City",
    "Arsenal",
    "Barcelona",
    "Atletico Madrid",

    // Pot 2
    "Borussia Dortmund",
    "Roma",
    "Sporting",
    "Aston Villa",
    "Porto",
    "Manchester United",
    "Club Brugge",
    "Real Betis",
    "PSV Eindhoven",

    // Pot 3
    "Feyenoord",
    "Lille",
    "Bodø/Glimt",
    "Napoli",
    "Leipzig",
    "Villareal",
    "Fenerbahçe",
    "Shakhtar",
    "Galatasaray",

    // Pot 4
    "Slavia Praha",
    "Slovan Bratislava",
    "Stuttgart",
    "AEK Athens",
    "LASK",
    "Como",
    "Lens",
    "Viking",
    "Sabah",
];

const elTeams: Teams = [
    // Pot 1
    "Bayer Leverkusen",
    "Benfica",
    "Juventus",
    "AC Milan",
    "Lyon",
    "AZ Alkmaar",
    "Olympiacos",
    "Real Sociedad",
    "Marseille",

    // Pot 2
    "Ferencváros",
    "Viktoria Plzeň",
    "Union Saint-Gilloise",
    "Dinamo Zagreb",
    "Red Bull Salzburg",
    "Celtic",
    "Sparta Praha",
    "Rennes",
    "Anderlecht",

    // Pot 3
    "Sturm Graz",
    "Lech Poznań",
    "Crystal Palace",
    "Bournemouth",
    "Sunderland",
    "Celje",
    "Jagiellonia Białystok",
    "Omonia",
    "Celta Vigo",

    // Pot 4
    "Hoffenheim",
    "Beşiktaş",
    "Torreense",
    "Hapoel Be'er Sheva",
    "NEC Nijmegen",
    "OFI Crete",
    "Lillestrøm",
    "Ararat-Armenia",
    "Levski Sofia",
];

const clTeams: Teams = [
    "Atalanta",
    "Braga",
    "Ajax",
    "Freiburg",
    "Monaco",
    "Copenhagen",

    "Midtjylland",
    "Crvena Zvezda",
    "Gent",
    "Panathinaikos",
    "Pafos",
    "Brighton",

    "Lugano",
    "Getafe",
    "KuPS Kuopio",
    "Twente",
    "Lincoln Red Imps",
    "Borac Banja Luka",

    "Sint Truidense",
    "Brann",
    "Hearts of Midlothian",
    "Kairat Almaty",
    "Trabzonspor",
    "Universitatea Craiova",

    "Riga",
    "Hajduk Split",
    "Jablonec",
    "Nordsjaelland",
    "Aarhus",
    "Inter Escaldes",

    "Thun",
    "CSKA Sofia",
    "Kauno Žalgiris",
    "Mjallby",
    "Iberia Tbilisi",
    "Egnatia",
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
