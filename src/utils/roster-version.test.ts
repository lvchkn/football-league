import { describe, expect, it } from "vitest";
import { computeRosterVersion } from "./roster-version.js";

describe("computeRosterVersion", () => {
    it("returns null for an empty roster", () => {
        expect(computeRosterVersion([])).toBeNull();
    });

    it("produces a stable hash for a given roster", () => {
        const version = computeRosterVersion(["A", "B"]);

        expect(version).toBeTruthy();
        expect(computeRosterVersion(["A", "B"])).toBe(version);
        expect(computeRosterVersion(["B", "A"])).not.toBe(version);
    });
});
