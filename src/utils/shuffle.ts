/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[], rng: () => number = Math.random): T[] {
    const shuffled = array.slice();

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}
