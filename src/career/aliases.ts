/**
 * UEFA competition lists spell some clubs differently from the domestic
 * lists. The UEFA names can't change (that would discard Classic saves),
 * so they are mapped here instead.
 */
export const UEFA_ALIASES: Record<string, string> = {
    "Bayern München": "Bayern Munich",
    Leipzig: "RB Leipzig",
    Stuttgart: "VfB Stuttgart",
    Freiburg: "SC Freiburg",
    Inter: "Inter Milan",
    "Atletico Madrid": "Atlético Madrid",
    Villareal: "Villarreal",
    Anderlecht: "RSC Anderlecht",
    Gent: "KAA Gent",
    "Union Saint-Gilloise": "Royale Union Saint-Gilloise",
    "Sint Truidense": "St. Truiden",
};

export function domesticName(uefaName: string): string {
    return UEFA_ALIASES[uefaName] ?? uefaName;
}
