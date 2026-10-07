// ========================================
// CUSTOMER PAGE PROTECTION
// ========================================

async function verifyCustomerSession() {

    const sessionToken =
        sessionStorage.getItem(
            "customerSessionToken"
        );

    if (!sessionToken) {

        window.location.href =
            "login.html";

        return false;
    }

    try {

        const response =
            await fetch(
                "/api/customer/session",
                {
                    method: "GET",

                    headers: {
                        "x-customer-session-token":
                            sessionToken
                    }
                }
            );

        if (!response.ok) {

            sessionStorage.removeItem(
                "customer"
            );

            sessionStorage.removeItem(
                "customerSessionToken"
            );

            window.location.href =
                "login.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(
            "Customer session verification failed:",
            error
        );

        return false;
    }
}

let productRows = [];

const categoryButtonsContainer =
    document.querySelector("#category-buttons");

const searchInput =
    document.querySelector("#product-search");

const productList =
    document.querySelector("#product-list");

const searchButton =
    document.querySelector("#search-button");

const suggestionsBox =
    document.querySelector("#search-suggestions");


// ========================================
// HIGHLIGHT SELECTED PRODUCT
// ========================================

function highlightProduct(row) {

    // Remove previous highlight
    productRows.forEach(function (productRow) {

        productRow.classList.remove(
            "product-highlight"
        );

    });


    // Highlight selected product
    row.classList.add(
        "product-highlight"
    );


    // Scroll product into view
    row.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}

// ========================================
// LOAD CATEGORIES FROM SERVER
// ========================================

async function loadCategories() {

    try {

        const response =
            await fetch("/api/categories");

        if (!response.ok) {

            throw new Error(
                "Failed to load categories."
            );

        }

        const categories =
            await response.json();

        categoryButtonsContainer.innerHTML = "";

        // ALL BUTTON

        const allButton =
            document.createElement("button");

        allButton.type = "button";

        allButton.classList.add(
            "category-btn",
            "active"
        );

        allButton.dataset.category = "All";

        allButton.textContent = "All";

        categoryButtonsContainer.appendChild(
            allButton
        );


        // CATEGORY BUTTONS

        categories.forEach(
            function (category) {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.classList.add(
                    "category-btn"
                );

                button.dataset.category =
                    category;

                button.textContent =
                    category;

                categoryButtonsContainer.appendChild(
                    button
                );

            }
        );

        enableCategoryFiltering();

    } catch (error) {

        console.error(error);

        categoryButtonsContainer.innerHTML = `
            <p>
                Unable to load categories.
            </p>
        `;

    }

}

// ========================================
// LOAD PRODUCTS FROM SERVER
// ========================================

async function loadProducts() {

    try {

        const response =
            await fetch("/api/customer/products", {
                headers: {
                    "x-customer-session-token":
                        sessionStorage.getItem(
                            "customerSessionToken"
                        )
                }
            });


        if (!response.ok) {

            throw new Error(
                "Failed to load products."
            );

        }


        const products =
            await response.json();


        productList.innerHTML = "";


        products.forEach(function (product) {

            const row =
                document.createElement("tr");


            row.dataset.category =
                product.category;


            row.dataset.id =
                product.id;


            row.innerHTML = `

                <td>${product.name}</td>

                <td>${product.category}</td>

                <td>${product.unit}</td>

                <td>
                    ₦${Number(product.price).toLocaleString()}
                </td>

                <td>${product.lastUpdated}</td>

            `;


            productList.appendChild(row);

        });


        // Refresh product rows
        productRows =
            Array.from(
                productList.querySelectorAll("tr")
            );


    } catch (error) {

        console.error(error);


        productList.innerHTML = `

            <tr>

                <td colspan="5">

                    Unable to load products.

                </td>

            </tr>

        `;

    }

}


// ========================================
// PRODUCT SEARCH SUGGESTIONS
// ========================================

searchInput.addEventListener(
    "input",
    function () {

        const searchText =
            searchInput.value
                .trim()
                .toLowerCase();


        suggestionsBox.innerHTML = "";


        // Remove previous highlight
        productRows.forEach(function (row) {

            row.classList.remove(
                "product-highlight"
            );

        });


        if (searchText === "") {
            return;
        }


        let matches = 0;


        productRows.forEach(function (row) {

            // Ignore products hidden by category filtering
            if (row.style.display === "none") {
                return;
            }


            const productName =
                row.cells[0]
                    .textContent
                    .toLowerCase();


            if (
                productName.includes(searchText)
            ) {

                const suggestion =
                    document.createElement("div");


                suggestion.classList.add(
                    "search-suggestion"
                );


                suggestion.textContent =
                    row.cells[0].textContent;


                // Click suggestion
                suggestion.addEventListener(
                    "click",
                    function () {

                        searchInput.value =
                            row.cells[0].textContent;


                        suggestionsBox.innerHTML =
                            "";


                        highlightProduct(row);

                    }
                );


                suggestionsBox.appendChild(
                    suggestion
                );


                matches++;

            }

        });


        // No results
        if (matches === 0) {

            const noResult =
                document.createElement("div");


            noResult.classList.add(
                "search-no-result"
            );


            noResult.textContent =
                "No matching products found.";


            suggestionsBox.appendChild(
                noResult
            );

        }

    }
);


// ========================================
// SEARCH BUTTON
// ========================================

searchButton.addEventListener(
    "click",
    function () {

        const searchText =
            searchInput.value
                .trim()
                .toLowerCase();


        if (searchText === "") {
            return;
        }


        let found = false;


        productRows.forEach(function (row) {

            // Ignore hidden products
            if (row.style.display === "none") {
                return;
            }


            const productName =
                row.cells[0]
                    .textContent
                    .toLowerCase();


            if (
                !found &&
                productName.includes(searchText)
            ) {

                highlightProduct(row);

                found = true;

            }

        });

    }
);


// ========================================
// ENTER KEY SEARCH
// ========================================

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchButton.click();

        }

    }
);


// ========================================
// CATEGORY FILTERING
// ========================================

function enableCategoryFiltering() {

    const categoryButtons =
        categoryButtonsContainer.querySelectorAll(
            ".category-btn"
        );

    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const selectedCategory =
                        button.dataset.category;

                    categoryButtons.forEach(
                        function (categoryButton) {

                            categoryButton.classList.remove(
                                "active"
                            );

                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    searchInput.value = "";

                    suggestionsBox.innerHTML =
                        "";

                    productRows.forEach(
                        function (row) {

                            row.classList.remove(
                                "product-highlight"
                            );

                        }
                    );

                    productRows.forEach(
                        function (row) {

                            const productCategory =
                                row.cells[1]
                                    .textContent
                                    .trim();

                            if (
                                selectedCategory === "All" ||
                                productCategory ===
                                selectedCategory
                            ) {

                                row.style.display =
                                    "";

                            } else {

                                row.style.display =
                                    "none";

                            }

                        }
                    );

                }
            );

        }
    );

}

// ========================================
// START
// ========================================

async function startCatalog() {

    const authenticated =
        await verifyCustomerSession();

    if (!authenticated) {
        return;
    }

    await loadProducts();

    await loadCategories();

}

startCatalog();

// ========================================
// CUSTOMER LOGOUT
// ========================================

const logoutLink =
    document.querySelector("#customer-logout");

if (logoutLink) {

    logoutLink.addEventListener("click", async function (event) {

        event.preventDefault();

        const sessionToken =
            sessionStorage.getItem(
                "customerSessionToken"
            );

        try {

            if (sessionToken) {

                await fetch(
                    "/api/customer/logout",
                    {
                        method: "POST",

                        headers: {
                            "x-customer-session-token":
                                sessionToken
                        }
                    }
                );
            }

        } catch (error) {

            console.error(
                "Customer logout failed:",
                error
            );

        } finally {

            sessionStorage.removeItem(
                "customer"
            );

            sessionStorage.removeItem(
                "customerSessionToken"
            );

            window.location.href =
                "login.html";
        }

    });

}