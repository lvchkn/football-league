let scrollToTopListener: (() => void) | null = null;

/**
 * Setup scroll-to-top button functionality
 * @return {void}
 */
export function setupScrollToTopButton(): void {
    const scrollButton: HTMLElement | null =
        document.getElementById("scroll-to-top");

    if (!scrollButton) return;

    // Show button when scrolled more than 1-2 screens (1000px or window height * 1.5)
    const scrollThreshold: number = Math.max(1000, window.innerHeight * 1.5);

    if (scrollToTopListener) {
        window.removeEventListener("scroll", scrollToTopListener);
    }

    let scrollTicking = false;
    scrollToTopListener = () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > scrollThreshold) {
                    scrollButton.classList.add("show");
                    scrollButton.style.display = "block";
                } else {
                    scrollButton.classList.remove("show");
                    scrollButton.style.display = "none";
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    };

    window.addEventListener("scroll", scrollToTopListener);

    scrollButton.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };
}

/**
 * Subscribe to league selection changes
 */
export function subscribeToLeagueChange(
    onChange: (league: string) => void,
): void {
    const selector = document.getElementById(
        "league-selector",
    ) as HTMLSelectElement;

    if (!selector) return;

    selector.addEventListener("change", (e) => {
        if (
            typeof onChange === "function" &&
            e.currentTarget instanceof HTMLSelectElement
        ) {
            onChange(e.currentTarget.value);
        }
    });
}

/**
 * Fill the league dropdown, one section per competition group.
 */
export function populateLeagueSelector(
    competitions: [string, { name: string; group: string }][],
): void {
    const selector = document.getElementById("league-selector");
    if (!selector) return;

    const groups = new Map<string, HTMLOptGroupElement>();
    competitions.forEach(function ([id, { name, group }]) {
        let optgroup = groups.get(group);
        if (!optgroup) {
            optgroup = document.createElement("optgroup");
            optgroup.label = group;
            groups.set(group, optgroup);
        }
        optgroup.appendChild(new Option(name, id));
    });

    selector.replaceChildren(...groups.values());
}

/**
 * Update the league selector dropdown to match the current selected league
 */
export function updateLeagueSelector(league: string): void {
    const selector = document.getElementById(
        "league-selector",
    ) as HTMLSelectElement;

    if (selector) selector.value = league;
}
