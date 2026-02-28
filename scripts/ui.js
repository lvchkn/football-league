window.FootballLeague = window.FootballLeague || {};

/**
 * Render the league table in the HTML
 * @return {void}
 */
function renderTable(table) {
    const tbody = document.querySelector("#standings tbody");
    tbody.innerHTML = "";

    const sortedTable = window.FootballLeague.sortTable(table);

    sortedTable.forEach((team, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${team.team}</td>
            <td>${team.played}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
            <td>${team.gf}</td>
            <td>${team.ga}</td>
            <td>${team.gf - team.ga}</td>
            <td>${team.points}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Render the fixtures in the HTML
 * @param {Array} fixtures - array of rounds, each round is array of matches
 * @param {Function} onResultApplied - callback when result is applied
 * @return {void}
 */
function renderFixtures(fixtures, onResultApplied) {
    const container = document.getElementById("fixtures");
    container.innerHTML = "";

    fixtures.forEach((round, i) => {
        const div = document.createElement("div");
        div.className = "matchday";
        div.innerHTML = `<h3>Matchday ${i + 1}</h3>`;

        round.forEach((match, idx) => {
            const line = document.createElement("div");
            line.className = "match";

            const id = `r${i}_m${idx}`;

            line.innerHTML = `
                ${match.home} 
                <input type="number" id="${id}_hg" min="0" style="width:40px" value="${
                    match.homeGoals != null ? match.homeGoals : ""
                }"> 
                -
                <input type="number" id="${id}_ag" min="0" style="width:40px" value="${
                    match.awayGoals != null ? match.awayGoals : ""
                }"> 
                ${match.away}
                <button id="${id}_btn">Apply result</button>
            `;

            line.querySelector(`#${id}_btn`).addEventListener("click", () => {
                const hgVal = line.querySelector(`#${id}_hg`).value;
                const agVal = line.querySelector(`#${id}_ag`).value;

                if (hgVal === "" || agVal === "") return;

                const parsedInput = _getHomeAndAwayGoals(hgVal, agVal);
                if (!parsedInput) return;

                const { homeGoals, awayGoals } = parsedInput;
                match.homeGoals = homeGoals;
                match.awayGoals = awayGoals;

                onResultApplied();
            });

            div.appendChild(line);
        });

        const resultsBtn = document.createElement("button");
        resultsBtn.className = "apply-all-btn";
        resultsBtn.textContent = "Apply all results";

        resultsBtn.addEventListener("click", () => {
            round.forEach((match, idx) => {
                const id = `r${i}_m${idx}`;
                const hgVal = div.querySelector(`#${id}_hg`).value;
                const agVal = div.querySelector(`#${id}_ag`).value;

                if (hgVal === "" || agVal === "") return;

                const parsedInput = _getHomeAndAwayGoals(hgVal, agVal);

                if (!parsedInput) return;

                const { homeGoals, awayGoals } = parsedInput;
                match.homeGoals = homeGoals;
                match.awayGoals = awayGoals;
            });

            onResultApplied();
        });

        div.appendChild(resultsBtn);

        container.appendChild(div);
    });

    _setupPersistenceControls(fixtures, onResultApplied);
}

/**
 * Get home and away goals from input values, with validation
 * @param {string} hgVal - home goals input value
 * @param {string} agVal - away goals input value
 * @return {Object|undefined} {homeGoals, awayGoals} or undefined if invalid
 */
function _getHomeAndAwayGoals(hgVal, agVal) {
    if (hgVal === "" || agVal === "") return;

    const hg = Number(hgVal);
    const ag = Number(agVal);

    if (!Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) {
        return;
    }

    return {
        homeGoals: hg,
        awayGoals: ag,
    };
}

/**
 * Wire the Save and Reset buttons to storage actions.
 * @param {Array} fixtures - fixtures array to persist
 * @param {Function} onResultApplied - callback to invoke after reset/save actions
 */
function _setupPersistenceControls(fixtures, onResultApplied) {
    const saveBtn = document.getElementById("save-btn");
    const resetBtn = document.getElementById("reset-btn");
    const regenerateBtn = document.getElementById("regenerate-btn");
    const currentLeague = window.FootballLeague.selectedLeague;

    if (saveBtn) {
        saveBtn.onclick = function () {
            if (
                window.FootballLeague &&
                window.FootballLeague.StorageModule &&
                window.FootballLeague.StorageModule.saveFixturesImmediate
            ) {
                window.FootballLeague.StorageModule.saveFixturesImmediate(
                    fixtures,
                    currentLeague,
                );
                const prev = saveBtn.textContent;
                saveBtn.textContent = "Saved";
                setTimeout(() => (saveBtn.textContent = prev), 1000);
            }
        };
    }

    if (resetBtn) {
        resetBtn.onclick = function () {
            if (
                window.FootballLeague &&
                window.FootballLeague.StorageModule &&
                window.FootballLeague.StorageModule.clearSavedFixtures
            ) {
                window.FootballLeague.StorageModule.clearSavedFixtures(
                    currentLeague,
                );
            }

            fixtures.forEach((round) =>
                round.forEach((match) => {
                    match.homeGoals = null;
                    match.awayGoals = null;
                }),
            );

            if (typeof onResultApplied === "function") onResultApplied();

            renderFixtures(fixtures, onResultApplied);
        };
    }

    if (regenerateBtn) {
        regenerateBtn.onclick = function () {
            if (
                window.FootballLeague &&
                typeof window.FootballLeague.regenerateFixtures === "function"
            ) {
                window.FootballLeague.regenerateFixtures();
            }
        };
    }
}

/**
 * Setup scroll-to-top button functionality
 * @return {void}
 */
let scrollToTopListener = null;

function setupScrollToTopButton() {
    const scrollBtn = document.getElementById("scroll-to-top");
    if (!scrollBtn) return;

    // Show button when scrolled more than 1-2 screens (1000px or window height * 1.5)
    const scrollThreshold = Math.max(1000, window.innerHeight * 1.5);

    if (scrollToTopListener) {
        window.removeEventListener("scroll", scrollToTopListener);
    }

    scrollToTopListener = () => {
        if (window.scrollY > scrollThreshold) {
            scrollBtn.classList.add("show");
        } else {
            scrollBtn.classList.remove("show");
        }
    };

    window.addEventListener("scroll", scrollToTopListener);

    scrollBtn.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupScrollToTopButton);
} else {
    setupScrollToTopButton();
}

/**
 * Subscribe to league selection changes
 * @param {Function} onChange - callback to invoke when league selection changes
 * @return {void}
 */
function subscribeToLeagueChange(onChange) {
    const selector = document.getElementById("league-selector");
    if (!selector) return;

    selector.addEventListener("change", (e) => {
        if (typeof onChange === "function") {
            onChange(e.target.value);
        }
    });
}

/**
 * Update the league selector dropdown to match the current selected league
 * @param {string} league - currently selected league
 * @return {void}
 */
function updateLeagueSelector(league) {
    const selector = document.getElementById("league-selector");
    if (selector) selector.value = league;
}

Object.assign(window.FootballLeague, {
    renderTable,
    renderFixtures,
    setupScrollToTopButton,
    subscribeToLeagueChange,
    updateLeagueSelector,
});
