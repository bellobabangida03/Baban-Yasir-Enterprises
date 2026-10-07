// ========================================
// PRICE HISTORY
// ========================================

// Store price-history records here.
let allPriceHistory = [];


// Store current products here.
// This allows us to display the product's
// category and unit.
let allProducts = [];


// ========================================
// DOM ELEMENTS
// ========================================

const priceHistoryList =
    document.querySelector("#price-history-list");

const priceHistorySearch =
    document.querySelector("#price-history-search");

const priceHistoryCategoryFilter =
    document.querySelector(
        "#price-history-category-filter"
    );

const clearPriceHistoryFilters =
    document.querySelector(
        "#clear-price-history-filters"
    );


// ========================================
// LOAD PRICE HISTORY
// ========================================

async function loadPriceHistory() {

    try {

        const [
            historyResponse,
            productsResponse
        ] = await Promise.all([

            fetch("/api/history"),

            fetch("/api/products")

        ]);


        if (
            !historyResponse.ok ||
            !productsResponse.ok
        ) {

            throw new Error(
                "Unable to load price history."
            );

        }


        const history =
            await historyResponse.json();

        allProducts =
            await productsResponse.json();


        // Only keep actual price changes.
        allPriceHistory =
            history.filter(
                function (record) {

                    return (
                        record.action ===
                        "Price Changed"
                    );

                }
            );


        populateCategoryFilter();

        renderPriceHistory();


    } catch (error) {

        console.error(error);

        priceHistoryList.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="history-empty">
                    Unable to load price history.
                </td>
            </tr>
        `;

    }

}


// ========================================
// POPULATE CATEGORY FILTER
// ========================================

function populateCategoryFilter() {

    const categories =
        [
            ...new Set(

                allPriceHistory
                    .map(
                        function (record) {

                            const product =
                                allProducts.find(
                                    function (item) {

                                        return (
                                            item.id ===
                                            record.productId
                                        );

                                    }
                                );

                            return product
                                ? product.category
                                : null;

                        }
                    )
                    .filter(Boolean)

            )
        ]
            .sort();


    priceHistoryCategoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;


    categories.forEach(
        function (category) {

            const option =
                document.createElement("option");

            option.value =
                category;

            option.textContent =
                category;

            priceHistoryCategoryFilter.appendChild(
                option
            );

        }
    );

}


// ========================================
// RENDER PRICE HISTORY
// ========================================

function renderPriceHistory() {

    const searchTerm =
        priceHistorySearch.value
            .trim()
            .toLowerCase();


    const selectedCategory =
        priceHistoryCategoryFilter.value;


    const filteredHistory =
        allPriceHistory.filter(
            function (record) {

                const product =
                    allProducts.find(
                        function (item) {

                            return (
                                item.id ===
                                record.productId
                            );

                        }
                    );


                const productName =
                    record.productName ||
                    (product
                        ? product.name
                        : "-");


                const category =
                    product
                        ? product.category
                        : "-";


                const matchesSearch =
                    !searchTerm ||
                    productName
                        .toLowerCase()
                        .includes(searchTerm);


                const matchesCategory =
                    !selectedCategory ||
                    category ===
                    selectedCategory;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    priceHistoryList.innerHTML = "";


    // ========================================
    // NO RESULTS
    // ========================================

    if (filteredHistory.length === 0) {

        priceHistoryList.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="history-empty">
                    No price history records found.
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

            const product =
                allProducts.find(
                    function (item) {

                        return (
                            item.id ===
                            record.productId
                        );

                    }
                );


            const productName =
                record.productName ||
                (product
                    ? product.name
                    : "-");


            const category =
                product
                    ? product.category
                    : "-";


            const unit =
                product
                    ? product.unit
                    : "-";


            const previousPrice =
                formatPrice(
                    record.oldValue
                );


            const newPrice =
                formatPrice(
                    record.newValue
                );


            const date =
                record.date
                    ? new Date(
                        record.date
                    ).toLocaleString(
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


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                productName
            )}
                </td>

                <td>
                    ${escapeHtml(
                category
            )}
                </td>

                <td>
                    ${escapeHtml(
                unit
            )}
                </td>

                <td>
                    ${previousPrice}
                </td>

                <td>
                    ${newPrice}
                </td>

                <td>
                    ${escapeHtml(
                record.adminName ||
                "-"
            )}
                </td>

                <td>
                    ${escapeHtml(
                date
            )}
                </td>

            `;


            priceHistoryList.appendChild(
                row
            );

        }
    );

}


// ========================================
// FORMAT PRICE
// ========================================

function formatPrice(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "-";

    }


    return (
        "₦" +
        number.toLocaleString(
            "en-NG"
        )
    );

}


// ========================================
// SEARCH
// ========================================

priceHistorySearch.addEventListener(
    "input",
    function () {

        renderPriceHistory();

    }
);


// ========================================
// CATEGORY FILTER
// ========================================

priceHistoryCategoryFilter.addEventListener(
    "change",
    function () {

        renderPriceHistory();

    }
);


// ========================================
// CLEAR FILTERS
// ========================================

clearPriceHistoryFilters.addEventListener(
    "click",
    function () {

        priceHistorySearch.value =
            "";

        priceHistoryCategoryFilter.value =
            "";

        renderPriceHistory();

    }
);


// ========================================
// HTML ESCAPE
// ========================================

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ========================================
// START
// ========================================

loadPriceHistory();