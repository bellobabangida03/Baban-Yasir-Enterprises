// ========================================
// ADMIN HISTORY
// ========================================

// Store all history records here.
// We keep the original records so that
// filtering can be applied repeatedly.
let allHistory = [];


// ========================================
// DOM ELEMENTS
// ========================================

const historyList =
    document.querySelector("#history-list");

const historySearch =
    document.querySelector("#history-search");

const historyActionFilter =
    document.querySelector("#history-action-filter");

const historyAdminFilter =
    document.querySelector("#history-admin-filter");

const clearHistoryFilters =
    document.querySelector("#clear-history-filters");


// ========================================
// LOAD HISTORY
// ========================================

async function loadHistory() {

    try {

        const response =
            await fetch("/api/history");

        if (!response.ok) {

            throw new Error(
                "Unable to load history."
            );

        }

        allHistory =
            await response.json();

        populateActionFilter();

        populateAdminFilter();

        renderHistory();

    } catch (error) {

        console.error(error);

        historyList.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="history-empty">
                    Unable to load history records.
                </td>
            </tr>
        `;

    }

}


// ========================================
// POPULATE ACTION FILTER
// ========================================

function populateActionFilter() {

    const actions =
        [
            ...new Set(
                allHistory
                    .map(
                        function (record) {
                            return record.action;
                        }
                    )
                    .filter(Boolean)
            )
        ]
            .sort();


    historyActionFilter.innerHTML = `
        <option value="">
            All Actions
        </option>
    `;


    actions.forEach(
        function (action) {

            const option =
                document.createElement("option");

            option.value =
                action;

            option.textContent =
                action;

            historyActionFilter.appendChild(
                option
            );

        }
    );

}


// ========================================
// POPULATE ADMIN FILTER
// ========================================

function populateAdminFilter() {

    const admins =
        [
            ...new Map(
                allHistory
                    .filter(
                        function (record) {
                            return record.adminId;
                        }
                    )
                    .map(
                        function (record) {

                            return [
                                record.adminId,
                                record.adminName
                            ];

                        }
                    )
            ).entries()
        ]
            .sort(
                function (a, b) {

                    return a[1].localeCompare(
                        b[1]
                    );

                }
            );


    historyAdminFilter.innerHTML = `
        <option value="">
            All Admins
        </option>
    `;


    admins.forEach(
        function ([adminId, adminName]) {

            const option =
                document.createElement("option");

            option.value =
                adminId;

            option.textContent =
                adminName;

            historyAdminFilter.appendChild(
                option
            );

        }
    );

}


// ========================================
// RENDER HISTORY
// ========================================

function renderHistory() {

    const searchTerm =
        historySearch.value
            .trim()
            .toLowerCase();

    const selectedAction =
        historyActionFilter.value;

    const selectedAdmin =
        historyAdminFilter.value;


    const filteredHistory =
        allHistory.filter(
            function (record) {

                const searchableText = [

                    record.adminName,

                    record.adminEmail,

                    record.action,

                    record.productName,

                    record.oldValue,

                    record.newValue

                ]
                    .filter(
                        value =>
                            value !== null &&
                            value !== undefined
                    )
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    searchableText.includes(
                        searchTerm
                    );


                const matchesAction =
                    !selectedAction ||
                    record.action ===
                    selectedAction;


                const matchesAdmin =
                    !selectedAdmin ||
                    String(record.adminId) ===
                    selectedAdmin;


                return (
                    matchesSearch &&
                    matchesAction &&
                    matchesAdmin
                );

            }
        );


    historyList.innerHTML = "";


    // ========================================
    // NO RESULTS
    // ========================================

    if (filteredHistory.length === 0) {

        historyList.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="history-empty">
                    No history records match your filters.
                </td>
            </tr>
        `;

        return;

    }


    // ========================================
    // DISPLAY RECORDS
    // ========================================

    filteredHistory.forEach(
        function (record) {

            const row =
                document.createElement("tr");


            const date =
                record.date
                    ? new Date(record.date)
                        .toLocaleString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                    : "-";


            const product =
                record.productName ||
                "-";


            const oldValue =
                record.oldValue !== null &&
                    record.oldValue !== undefined
                    ? record.oldValue
                    : "-";


            const newValue =
                record.newValue !== null &&
                    record.newValue !== undefined
                    ? record.newValue
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                record.adminName || "-"
            )}
                </td>

                <td>
                    ${escapeHtml(
                record.action || "-"
            )}
                </td>

                <td>
                    ${escapeHtml(
                product
            )}
                </td>

                <td>
                    ${escapeHtml(
                String(oldValue)
            )}
                </td>

                <td>
                    ${escapeHtml(
                String(newValue)
            )}
                </td>

                <td>
                    ${escapeHtml(
                date
            )}
                </td>

            `;


            historyList.appendChild(row);

        }
    );

}


// ========================================
// SEARCH
// ========================================

historySearch.addEventListener(
    "input",
    function () {

        renderHistory();

    }
);


// ========================================
// ACTION FILTER
// ========================================

historyActionFilter.addEventListener(
    "change",
    function () {

        renderHistory();

    }
);


// ========================================
// ADMIN FILTER
// ========================================

historyAdminFilter.addEventListener(
    "change",
    function () {

        renderHistory();

    }
);


// ========================================
// CLEAR FILTERS
// ========================================

clearHistoryFilters.addEventListener(
    "click",
    function () {

        historySearch.value = "";

        historyActionFilter.value = "";

        historyAdminFilter.value = "";

        renderHistory();

    }
);


// ========================================
// HTML ESCAPE
// ========================================

// Prevent history values from being interpreted
// as HTML when inserted into the table.
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================
// START
// ========================================

loadHistory();