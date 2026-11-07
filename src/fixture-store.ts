import type { Match } from "./interfaces/match.js";
import type { Round } from "./interfaces/round.js";

const DEBOUNCE_MS = 300;

export interface FixtureStoreOptions {
    /** Key prefix, e.g. "football-league:" -> "football-league:fixtures:<id>". */
    prefix: string;
    /** Id used when an empty one is passed. */
    defaultId: string;
    /** Roster version saved data must match; null skips the check. */
    expectedVersion(id: string): string | null;
    /** What to persist per match for results. */
    serializeResult(match: Match): unknown;
    /** What to persist per match for the fixture structure. */
    serializeStructure(match: Match): unknown;
    /** Further per-id keys (by name) cleared together with the fixtures. */
    extraKeys?: string[];
}

/**
 * localStorage persistence for one kind of competition: fixture results
 * (debounced or immediate), fixture structure, and a roster version that
 * invalidates everything when the team list changes.
 */
export function createFixtureStore(options: FixtureStoreOptions) {
    const { prefix, defaultId, serializeResult, serializeStructure, extraKeys = [] } = options;
    const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

    const idOf = (id: string) => id || defaultId;

    /** Storage key for a named piece of data, e.g. key("phase", "ucl"). */
    function key(name: string, id: string): string {
        return `${prefix}${name}:${idOf(id)}`;
    }

    function cancelPendingSave(id: string): void {
        const existing = pendingSaves.get(idOf(id));
        if (existing) {
            clearTimeout(existing);
            pendingSaves.delete(idOf(id));
        }
    }

    function expected(id: string, provided?: string | null): string | null {
        return provided || options.expectedVersion(id);
    }

    function writeVersion(id: string, rosterVersion?: string | null): void {
        const version = expected(id, rosterVersion);
        try {
            if (version) localStorage.setItem(key("fixtures-version", id), version);
            else localStorage.removeItem(key("fixtures-version", id));
        } catch {
            return;
        }
    }

    /** Remove fixtures, structure, version and any extra keys. */
    function clearPersisted(id: string): void {
        try {
            ["fixtures", "fixtures-structure", "fixtures-version", ...extraKeys].forEach((name) =>
                localStorage.removeItem(key(name, id)),
            );
        } catch {
            return;
        }
    }

    /**
     * True when saved data belongs to the current roster. Stale data is
     * cleared on the spot.
     */
    function checkVersion(id: string, rosterVersion?: string | null): boolean {
        const version = expected(id, rosterVersion);
        if (!version) return true;

        let stored: string | null = null;
        try {
            stored = localStorage.getItem(key("fixtures-version", id)) || null;
        } catch {
            stored = null;
        }

        if (stored === version) return true;
        clearPersisted(id);
        return false;
    }

    function readJson(name: string, id: string): any {
        try {
            const raw = localStorage.getItem(key(name, id));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function writeJson(name: string, id: string, value: unknown): boolean {
        try {
            localStorage.setItem(key(name, id), JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    function results(fixtures: Round[]): unknown[][] {
        return fixtures.map((round) => round.matches.map(serializeResult));
    }

    function saveResults(serialized: unknown[][], id: string, rosterVersion?: string | null): boolean {
        if (!writeJson("fixtures", id, serialized)) return false;
        writeVersion(id, rosterVersion);
        return true;
    }

    return {
        key,
        cancelPendingSave,
        checkVersion,
        writeVersion,
        clearPersisted,
        readJson,
        writeJson,

        getFixtures(id: string, rosterVersion?: string | null): any {
            if (!checkVersion(id, rosterVersion)) return null;
            return readJson("fixtures", id);
        },

        setFixturesDebounced(fixtures: Round[], id: string, rosterVersion?: string | null): void {
            cancelPendingSave(id);
            const serialized = results(fixtures);
            const timeout = setTimeout(function () {
                saveResults(serialized, id, rosterVersion);
                pendingSaves.delete(idOf(id));
            }, DEBOUNCE_MS);
            pendingSaves.set(idOf(id), timeout);
        },

        setFixturesImmediate(fixtures: Round[], id: string, rosterVersion?: string | null): boolean {
            cancelPendingSave(id);
            return saveResults(results(fixtures), id, rosterVersion);
        },

        getFixturesStructure(id: string, rosterVersion?: string | null): any {
            if (!checkVersion(id, rosterVersion)) return null;
            return readJson("fixtures-structure", id);
        },

        setFixturesStructure(fixtures: Round[], id: string, rosterVersion?: string | null): boolean {
            const structure = fixtures.map((round) => round.matches.map(serializeStructure));
            if (!writeJson("fixtures-structure", id, structure)) return false;
            writeVersion(id, rosterVersion);
            return true;
        },

        /** Cancel pending saves and remove everything stored for this id. */
        clearAll(id: string): void {
            cancelPendingSave(id);
            clearPersisted(id);
        },
    };
}
