/**
 * Render the league table in the HTML
 * @return {void}
 */
function renderTable() {
    const tbody = document.querySelector("#standings tbody");
    tbody.innerHTML = "";

    const sorted = getSortedTable();

    sorted.forEach((t, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${t.team}</td>
            <td>${t.played}</td>
            <td>${t.wins}</td>
            <td>${t.draws}</td>
            <td>${t.losses}</td>
            <td>${t.gf}</td>
            <td>${t.ga}</td>
            <td>${t.gf - t.ga}</td>
            <td>${t.points}</td>
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

        round.forEach((m, idx) => {
            const line = document.createElement("div");
            line.className = "match";

            const id = `r${i}_m${idx}`;

            line.innerHTML = `
                ${m.home} 
                <input type="number" id="${id}_hg" min="0" style="width:40px" value="${
                m.hg != null ? m.hg : ""
            }"> 
                -
                <input type="number" id="${id}_ag" min="0" style="width:40px" value="${
                m.ag != null ? m.ag : ""
            }"> 
                ${m.away}
                <button id="${id}_btn">Apply result</button>
            `;

            line.querySelector(`#${id}_btn`).addEventListener("click", () => {
                const hgVal = line.querySelector(`#${id}_hg`).value;
                const agVal = line.querySelector(`#${id}_ag`).value;

                if (hgVal === "" || agVal === "") return;

                m.hg = parseInt(hgVal, 10);
                m.ag = parseInt(agVal, 10);

                onResultApplied();
            });

            div.appendChild(line);
        });

        const resultsBtn = document.createElement("button");
        resultsBtn.className = "apply-all-btn";
        resultsBtn.textContent = "Apply all results";
        resultsBtn.addEventListener("click", () => {
            round.forEach((m, idx) => {
                const id = `r${i}_m${idx}`;
                const hgVal = div.querySelector(`#${id}_hg`).value;
                const agVal = div.querySelector(`#${id}_ag`).value;

                if (hgVal === "" || agVal === "") return;

                m.hg = parseInt(hgVal, 10);
                m.ag = parseInt(agVal, 10);
            });

            onResultApplied();
        });

        div.appendChild(resultsBtn);

        container.appendChild(div);
    });

    if (typeof setupPersistenceControls === "function") {
        setupPersistenceControls(fixtures, onResultApplied);
    }
}

/**
 * Wire the Save and Reset buttons to storage actions.
 * @param {Array} fixtures - fixtures array to persist
 * @param {Function} onResultApplied - callback to invoke after reset/save actions
 */
function setupPersistenceControls(fixtures, onResultApplied) {
    const saveBtn = document.getElementById("save-btn");
    const resetBtn = document.getElementById("reset-btn");

    if (saveBtn) {
        saveBtn.onclick = function () {
            if (
                window.StorageModule &&
                window.StorageModule.immediateSaveFixtures
            ) {
                window.StorageModule.immediateSaveFixtures(fixtures);
                const prev = saveBtn.textContent;
                saveBtn.textContent = "Saved";
                setTimeout(() => (saveBtn.textContent = prev), 900);
            }
        };
    }

    if (resetBtn) {
        resetBtn.onclick = function () {
            if (
                window.StorageModule &&
                window.StorageModule.clearSavedResults
            ) {
                window.StorageModule.clearSavedResults();
            }

            fixtures.forEach((round) =>
                round.forEach((m) => {
                    m.hg = null;
                    m.ag = null;
                })
            );

            // call provided callback to recalc table and trigger autosave
            if (typeof onResultApplied === "function") onResultApplied();

            renderFixtures(fixtures, onResultApplied);
        };
    }
}
