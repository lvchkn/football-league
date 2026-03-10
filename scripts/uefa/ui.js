window.FootballLeague = window.FootballLeague || {};
window.FootballLeague.UEFA = window.FootballLeague.UEFA || {};

/**
 * Human-readable label for each UEFA phase.
 */
var PHASE_LABELS = {
    league: "League Phase",
    playoffs: "Knockout Playoffs",
    r16: "Round of 16",
    quarterfinals: "Quarter-finals",
    semifinals: "Semi-finals",
    final: "Final",
};

/**
 * Render the UEFA league table in the #standings element.
 * Only meaningful during the league phase.
 * @param {Object} table
 * @param {string} phase
 */
function renderUEFATable(table, phase) {
    var standingsSection = document.querySelector(".standings-section");
    var tbody = document.querySelector("#standings tbody");
    if (!tbody) return;

    // During knockout phases, hide the league table and show a summary instead
    if (phase !== "league") {
        if (standingsSection) standingsSection.style.display = "none";
        return;
    }

    if (standingsSection) standingsSection.style.display = "";
    tbody.innerHTML = "";

    var sorted = window.FootballLeague.UEFA.sortTable(table);

    sorted.forEach(function (team, i) {
        var tr = document.createElement("tr");

        // Colour-code qualifying positions
        if (i < 8) {
            tr.style.backgroundColor = "rgba(0,180,80,0.12)"; // top 8 — auto R16
        } else if (i < 24) {
            tr.style.backgroundColor = "rgba(255,165,0,0.10)"; // 9-24 — playoffs
        }

        tr.innerHTML =
            "<td>" +
            (i + 1) +
            "</td>" +
            "<td>" +
            team.team +
            "</td>" +
            "<td>" +
            team.played +
            "</td>" +
            "<td>" +
            team.wins +
            "</td>" +
            "<td>" +
            team.draws +
            "</td>" +
            "<td>" +
            team.losses +
            "</td>" +
            "<td>" +
            team.gf +
            "</td>" +
            "<td>" +
            team.ga +
            "</td>" +
            "<td>" +
            (team.gf - team.ga) +
            "</td>" +
            "<td>" +
            team.points +
            "</td>";

        tbody.appendChild(tr);
    });
}

/**
 * Parse a pair of goal-input strings and return validated integers.
 * @return {{ homeGoals: number, awayGoals: number } | null}
 */
function _parseGoals(hgStr, agStr) {
    var hg = parseInt(hgStr, 10);
    var ag = parseInt(agStr, 10);
    if (!Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0)
        return null;
    return { homeGoals: hg, awayGoals: ag };
}

/**
 * Render UEFA fixtures for the current phase.
 * During knockout phases it also shows aggregate scores per tie.
 * @param {Array<Array<Object>>} fixtures
 * @param {Function} onResultApplied
 * @param {string} phase
 */
function renderUEFAFixtures(fixtures, onResultApplied, phase) {
    phase = phase || "league";
    var container = document.getElementById("fixtures");
    if (!container) return;
    container.innerHTML = "";

    // Phase banner
    var banner = document.createElement("div");
    banner.className = "phase-indicator";
    banner.innerHTML =
        "<strong>Current Phase: " +
        (PHASE_LABELS[phase] || phase) +
        "</strong>";
    container.appendChild(banner);

    var isKnockout = phase !== "league";

    fixtures.forEach(function (round, i) {
        var div = document.createElement("div");
        div.className = "matchday";

        var roundLabel;
        if (phase === "league") {
            roundLabel = "Matchday " + (i + 1);
        } else {
            roundLabel = PHASE_LABELS[phase] || "Round " + (i + 1);
        }
        div.innerHTML = "<h3>" + roundLabel + "</h3>";

        // If knockout, group matches into ties for aggregate display
        if (isKnockout && phase !== "final") {
            _renderKnockoutRound(div, round, i, onResultApplied);
        } else {
            _renderLeagueRound(div, round, i, onResultApplied);
        }

        // "Apply all results" button
        var applyAllBtn = document.createElement("button");
        applyAllBtn.className = "apply-all-btn";
        applyAllBtn.textContent = "Apply all results";
        applyAllBtn.addEventListener("click", function () {
            round.forEach(function (match, idx) {
                var id = "r" + i + "_m" + idx;
                var hgEl = div.querySelector("#" + id + "_hg");
                var agEl = div.querySelector("#" + id + "_ag");
                if (!hgEl || !agEl || hgEl.value === "" || agEl.value === "")
                    return;
                var parsed = _parseGoals(hgEl.value, agEl.value);
                if (!parsed) return;
                match.homeGoals = parsed.homeGoals;
                match.awayGoals = parsed.awayGoals;
            });
            onResultApplied();
        });
        div.appendChild(applyAllBtn);

        container.appendChild(div);
    });
}

/**
 * Render a set of league-phase matches (no ties, no aggregates).
 */
function _renderLeagueRound(container, round, roundIdx, onResultApplied) {
    round.forEach(function (match, idx) {
        container.appendChild(
            _createMatchRow(match, roundIdx, idx, onResultApplied),
        );
    });
}

/**
 * Render a knockout round grouped into two-leg ties with aggregate display.
 */
function _renderKnockoutRound(container, round, roundIdx, onResultApplied) {
    // Matches come in leg-1/leg-2 pairs
    for (var t = 0; t < round.length; t += 2) {
        var leg1 = round[t];
        var leg2 = round[t + 1];

        var tieDiv = document.createElement("div");
        tieDiv.className = "knockout-tie";
        tieDiv.style.marginBottom = "16px";
        tieDiv.style.padding = "8px";
        tieDiv.style.border = "1px solid #ccc";
        tieDiv.style.borderRadius = "6px";

        // Tie header (e.g. "Team A vs Team B")
        var header = document.createElement("div");
        header.style.fontWeight = "bold";
        header.style.marginBottom = "6px";
        header.textContent = leg1.home + " vs " + leg1.away;
        tieDiv.appendChild(header);

        tieDiv.appendChild(
            _createMatchRow(leg1, roundIdx, t, onResultApplied, "Leg 1"),
        );
        tieDiv.appendChild(
            _createMatchRow(leg2, roundIdx, t + 1, onResultApplied, "Leg 2"),
        );

        // Aggregate display
        var aggDiv = document.createElement("div");
        aggDiv.className = "aggregate-display";
        aggDiv.style.marginTop = "4px";
        aggDiv.style.fontStyle = "italic";
        _updateAggregate(aggDiv, leg1, leg2);
        tieDiv.appendChild(aggDiv);

        container.appendChild(tieDiv);
    }
}

/**
 * Build a single match input row.
 */
function _createMatchRow(match, roundIdx, matchIdx, onResultApplied, label) {
    var line = document.createElement("div");
    line.className = "match";

    var id = "r" + roundIdx + "_m" + matchIdx;
    var labelText = label ? " (" + label + ")" : "";

    line.innerHTML =
        match.home +
        ' <input type="number" id="' +
        id +
        '_hg" min="0" style="width:40px" value="' +
        (match.homeGoals != null ? match.homeGoals : "") +
        '">' +
        " - " +
        '<input type="number" id="' +
        id +
        '_ag" min="0" style="width:40px" value="' +
        (match.awayGoals != null ? match.awayGoals : "") +
        '"> ' +
        match.away +
        labelText +
        ' <button id="' +
        id +
        '_btn">Apply result</button>';

    line.querySelector("#" + id + "_btn").addEventListener(
        "click",
        function () {
            var hgVal = line.querySelector("#" + id + "_hg").value;
            var agVal = line.querySelector("#" + id + "_ag").value;
            if (hgVal === "" || agVal === "") return;
            var parsed = _parseGoals(hgVal, agVal);
            if (!parsed) return;
            match.homeGoals = parsed.homeGoals;
            match.awayGoals = parsed.awayGoals;
            onResultApplied();
        },
    );

    return line;
}

/**
 * Update an aggregate-display element with computed totals.
 */
function _updateAggregate(el, leg1, leg2) {
    if (
        leg1.homeGoals === null ||
        leg1.awayGoals === null ||
        leg2.homeGoals === null ||
        leg2.awayGoals === null
    ) {
        el.textContent = "Aggregate: TBD";
        return;
    }

    var agg1 = leg1.homeGoals + leg2.awayGoals; // leg1.home's aggregate
    var agg2 = leg1.awayGoals + leg2.homeGoals;
    el.textContent =
        "Aggregate: " + leg1.home + " " + agg1 + " – " + agg2 + " " + leg1.away;

    if (agg1 > agg2) {
        el.textContent += " → " + leg1.home + " advances";
    } else if (agg2 > agg1) {
        el.textContent += " → " + leg1.away + " advances";
    } else {
        el.textContent += " → " + leg1.home + " advances (higher seed)";
    }
}

/**
 * Render the "Progress to Next Phase" button.
 * @param {Function} onProgressClick
 */
function renderPhaseProgressionButtons(onProgressClick) {
    var container = document.getElementById("fixtures");
    if (!container) return;

    var wrapper = document.createElement("div");
    wrapper.className = "phase-buttons";
    wrapper.style.marginTop = "20px";

    var btn = document.createElement("button");
    btn.id = "progress-phase-btn";
    btn.textContent = "Progress to Next Phase";
    btn.addEventListener("click", onProgressClick);

    wrapper.appendChild(btn);
    container.appendChild(wrapper);
}

Object.assign(window.FootballLeague.UEFA, {
    renderTable: renderUEFATable,
    renderFixtures: renderUEFAFixtures,
    renderPhaseProgressionButtons: renderPhaseProgressionButtons,
});
