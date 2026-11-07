export type Mode = "classic" | "career";

const MODE_KEY = "football-league:mode";

export function getMode(): Mode {
    try {
        return localStorage.getItem(MODE_KEY) === "career" ? "career" : "classic";
    } catch {
        return "classic";
    }
}

export function setMode(mode: Mode): void {
    try {
        localStorage.setItem(MODE_KEY, mode);
    } catch {
        return;
    }
}
