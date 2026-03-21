import { describe, it, expect } from "vitest";
import { shuffleArray } from "./shuffle.js";

describe("Shuffle Utility", () => {
    it("should return a new array (not mutate original)", () => {
        const input = [1, 2, 3, 4, 5];
        const inputSnapshot = [...input];

        const result = shuffleArray(input);

        expect(result).toHaveLength(5);
        // Ensure a new reference was created
        expect(result).not.toBe(input);
        // Ensure the original array wasn't altered
        expect(input).toEqual(inputSnapshot);
    });

    it("should contain the exact same elements as the original array", () => {
        const input = ["Team A", "Team B", "Team C", "Team D", "Team E"];
        const result = shuffleArray(input);

        const sortedInput = [...input].sort();
        const sortedResult = [...result].sort();

        expect(sortedResult).toEqual(sortedInput);
    });

    it("should handle an empty array", () => {
        const result = shuffleArray([]);
        expect(result).toEqual([]);
    });

    it("should handle a single-element array", () => {
        const result = shuffleArray(["Chelsea"]);
        expect(result).toEqual(["Chelsea"]);
    });
});
