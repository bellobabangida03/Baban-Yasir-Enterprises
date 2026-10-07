// ========================================
// BULK PRODUCT IMPORT
// ========================================

const importForm =
    document.querySelector(
        "#product-import-form"
    );

const importFile =
    document.querySelector(
        "#product-import-file"
    );

const clearImportButton =
    document.querySelector(
        "#clear-import-button"
    );

const backToDashboardButton =
    document.querySelector(
        "#back-to-dashboard-button"
    );

const importPreviewSection =
    document.querySelector(
        "#import-preview-section"
    );

const importSummary =
    document.querySelector(
        "#import-summary"
    );

const importPreviewList =
    document.querySelector(
        "#import-preview-list"
    );

const confirmImportButton =
    document.querySelector(
        "#confirm-import-button"
    );

const cancelImportButton =
    document.querySelector(
        "#cancel-import-button"
    );


// ========================================
// IMPORT STATE
// ========================================

let validatedProducts = [];


// ========================================
// BACK TO DASHBOARD
// ========================================

backToDashboardButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "/admin/dashboard.html";

    }
);


// ========================================
// PARSE CSV LINE
// ========================================

function parseCSVLine(line) {

    const values = [];

    let currentValue = "";

    let insideQuotes = false;


    for (
        let index = 0;
        index < line.length;
        index++
    ) {

        const character =
            line[index];


        if (character === '"') {

            if (
                insideQuotes &&
                line[index + 1] === '"'
            ) {

                currentValue += '"';

                index++;

            } else {

                insideQuotes =
                    !insideQuotes;

            }

        } else if (
            character === "," &&
            !insideQuotes
        ) {

            values.push(
                currentValue.trim()
            );

            currentValue = "";

        } else {

            currentValue += character;

        }

    }


    values.push(
        currentValue.trim()
    );


    return values;
}


// ========================================
// CLEAN CSV VALUE
// ========================================

function cleanCSVValue(value) {

    return value
        .replace(/^\uFEFF/, "")
        .trim();

}

// ========================================
// NORMALIZE IMPORT UNIT
// ========================================

function normalizeImportUnit(
    unit
) {

    const cleanedUnit =
        unit
            .trim()
            .replace(/\s+/g, " ");


    if (!cleanedUnit) {
        return "";
    }


    if (
        cleanedUnit
            .toLowerCase()
            .startsWith("per ")
    ) {

        return (
            "Per " +
            cleanedUnit
                .slice(4)
                .trim()
        );

    }


    return (
        "Per " +
        cleanedUnit
    );

}

// ========================================
// VALIDATE CSV
// ========================================

function validateCSV(
    csvText
) {

    const lines =
        csvText
            .split(/\r?\n/)
            .filter(function (line) {

                return line.trim() !== "";

            });


    if (lines.length < 2) {

        throw new Error(
            "The CSV file must contain a header and at least one product."
        );

    }


    const headers =
        parseCSVLine(
            lines[0]
        ).map(
            cleanCSVValue
        );


    const requiredHeaders = [
        "Product Name",
        "Category",
        "Unit"
    ];


    const missingHeaders =
        requiredHeaders.filter(
            function (header) {

                return !headers.includes(
                    header
                );

            }
        );


    if (missingHeaders.length > 0) {

        throw new Error(
            "Missing required column(s): " +
            missingHeaders.join(", ")
        );

    }


    const extraHeaders =
        headers.filter(
            function (header) {

                return !requiredHeaders.includes(
                    header
                );

            }
        );


    const products = [];

    const duplicateNames =
        new Set();

    const errors = [];


    for (
        let index = 1;
        index < lines.length;
        index++
    ) {

        const rowNumber =
            index + 1;

        const productIndex =
            index;


        const values =
            parseCSVLine(
                lines[index]
            );


        const row = {};


        headers.forEach(
            function (header, headerIndex) {

                row[header] =
                    cleanCSVValue(
                        values[headerIndex] ||
                        ""
                    );

            }
        );


        const name =
            row["Product Name"] || "";

        const category =
            row["Category"] || "";

        const unit =
            normalizeImportUnit(
                row["Unit"] || ""
            );


        if (
            !name ||
            !category ||
            !unit
        ) {

            errors.push(
                `Row ${rowNumber}: Name, Category and Unit are required.`
            );

            products.push({
                rowNumber,
                productIndex,
                name,
                category,
                unit,
                status: "Error"
            });

            continue;

        }


        const normalizedName =
            name.toLowerCase();


        if (
            duplicateNames.has(
                normalizedName
            )
        ) {

            errors.push(
                `Row ${rowNumber}: Duplicate product name "${name}".`
            );

            products.push({
                rowNumber,
                productIndex,
                name,
                category,
                unit,
                status: "Duplicate"
            });

            continue;

        }


        duplicateNames.add(
            normalizedName
        );


        products.push({
            rowNumber,
            productIndex,
            name,
            category,
            unit,
            status: "Ready"
        });

    }


    return {
        headers,
        extraHeaders,
        products,
        errors
    };

}


// ========================================
// DISPLAY PREVIEW
// ========================================

function displayPreview(
    validationResult
) {

    const {
        headers,
        extraHeaders,
        products,
        errors
    } = validationResult;


    importPreviewList.innerHTML = "";


    products.forEach(
        function (product) {

            const row =
                document.createElement(
                    "tr"
                );


            row.id =
                `import-product-${product.productIndex}`;


            row.innerHTML = `
                <td>
                    ${product.productIndex}
                </td>

                <td>
                    ${product.name}
                </td>

                <td>
                    ${product.category}
                </td>

                <td>
                    ${product.unit}
                </td>

                <td>
                    ${product.status}
                </td>
            `;


            importPreviewList.appendChild(
                row
            );

        }
    );


    const readyCount =
        products.filter(
            function (product) {
                return product.status === "Ready";
            }
        ).length;


    const errorProducts =
        products.filter(
            function (product) {
                return (
                    product.status === "Error" ||
                    product.status === "Duplicate"
                );
            }
        );


    let validationErrorHTML = "";


    if (errorProducts.length > 0) {

        validationErrorHTML = `
            <br><br>

            <strong>
                Validation errors:
            </strong>

            <br><br>

            <ul>
                ${errorProducts.map(
            function (product) {

                return `
                <li>
                    <button
                        type="button"
                        class="import-error-link"
                        data-product-index="${product.productIndex}"
                    >
                        SN ${product.productIndex}
                    </button>

                    — ${product.status}
                    — ${product.name}

                    ${product.status === "Duplicate"
                        ? "is a duplicate product name."
                        : "has missing required information."
                    }
                </li>
            `;

            }
        ).join("")}
            </ul>
        `;

    }


    importSummary.innerHTML = `
        <strong>
            Total rows:
        </strong>
        ${products.length}

        <br>

        <strong>
            Ready:
        </strong>
        ${readyCount}

        <br>

        <strong>
            Errors:
        </strong>
        ${errors.length}

        ${extraHeaders.length > 0
            ? `
                    <br>

                    <strong>
                        Extra column(s):
                    </strong>
                    ${extraHeaders.join(", ")}
                `
            : ""
        }

        ${validationErrorHTML}
    `;


    importPreviewSection.hidden =
        false;


    confirmImportButton.disabled =
        errors.length > 0;


    validatedProducts =
        errors.length === 0
            ? products
            : [];


    // ========================================
    // ERROR NAVIGATION
    // ========================================

    const errorLinks =
        document.querySelectorAll(
            ".import-error-link"
        );


    errorLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    const productIndex =
                        this.dataset.productIndex;


                    const targetRow =
                        document.querySelector(
                            `#import-product-${productIndex}`
                        );


                    if (!targetRow) {
                        return;
                    }


                    targetRow.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });


                    targetRow.classList.add(
                        "import-error-highlight"
                    );


                    setTimeout(
                        function () {

                            targetRow.classList.remove(
                                "import-error-highlight"
                            );

                        },
                        2000
                    );

                }
            );

        }
    );

}


// ========================================
// VALIDATE & PREVIEW
// ========================================

importForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!importFile.files.length) {

            alert(
                "Please select a CSV file."
            );

            return;

        }


        const selectedFile =
            importFile.files[0];


        if (
            !selectedFile.name
                .toLowerCase()
                .endsWith(".csv")
        ) {

            alert(
                "Please select a CSV file."
            );

            return;

        }


        try {

            const csvText =
                await selectedFile.text();


            const validationResult =
                validateCSV(
                    csvText
                );


            displayPreview(
                validationResult
            );


        } catch (error) {

            console.error(
                "CSV validation error:",
                error
            );


            alert(
                error.message ||
                "Unable to validate CSV file."
            );

        }

    }
);


// ========================================
// CLEAR IMPORT
// ========================================

clearImportButton.addEventListener(
    "click",
    function () {

        importForm.reset();

        importPreviewSection.hidden =
            true;

        importPreviewList.innerHTML =
            "";

        importSummary.innerHTML =
            "";

        confirmImportButton.disabled =
            true;

        validatedProducts = [];

    }
);


// ========================================
// CANCEL PREVIEW
// ========================================

cancelImportButton.addEventListener(
    "click",
    function () {

        importPreviewSection.hidden =
            true;

        validatedProducts = [];

        confirmImportButton.disabled =
            true;

    }
);


// ========================================
// IMPORT BUTTON
// ========================================

confirmImportButton.addEventListener(
    "click",
    async function () {

        // ========================================
        // CHECK VALIDATED PRODUCTS
        // ========================================

        if (
            !validatedProducts ||
            validatedProducts.length === 0
        ) {

            alert(
                "There are no validated products ready for import."
            );

            return;

        }


        // ========================================
        // GET ADMIN SESSION TOKEN
        // ========================================

        const sessionToken =
            sessionStorage.getItem(
                "adminSessionToken"
            );


        if (!sessionToken) {

            alert(
                "Your admin session has expired. Please log in again."
            );

            window.location.href =
                "/admin/login.html";

            return;

        }


        // ========================================
        // PREPARE PRODUCTS FOR SERVER
        // ========================================

        const productsToImport =
            validatedProducts.map(
                function (product) {

                    return {
                        name:
                            product.name,

                        category:
                            product.category,

                        unit:
                            product.unit
                    };

                }
            );


        // ========================================
        // PREVENT DOUBLE IMPORT
        // ========================================

        confirmImportButton.disabled =
            true;

        confirmImportButton.textContent =
            "Importing...";


        try {

            // ========================================
            // SEND PRODUCTS TO SERVER
            // ========================================

            const response =
                await fetch(
                    "/api/admin/products/import",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-admin-session-token":
                                sessionToken
                        },

                        body:
                            JSON.stringify({
                                products:
                                    productsToImport
                            })
                    }
                );


            const data =
                await response.json();


            // ========================================
            // HANDLE SESSION ERROR
            // ========================================

            if (
                response.status === 401
            ) {

                sessionStorage.removeItem(
                    "admin"
                );

                sessionStorage.removeItem(
                    "adminSessionToken"
                );

                alert(
                    "Your admin session has expired. Please log in again."
                );

                window.location.href =
                    "/admin/login.html";

                return;

            }


            // ========================================
            // HANDLE PERMISSION ERROR
            // ========================================

            if (
                response.status === 403
            ) {

                alert(
                    data.message ||
                    "Only the Super Admin can perform bulk product imports."
                );

                return;

            }


            // ========================================
            // HANDLE VALIDATION / SERVER ERROR
            // ========================================

            if (!response.ok) {

                const errorMessage =
                    data.errors &&
                        data.errors.length > 0
                        ? data.errors.join("\n")
                        : (
                            data.message ||
                            "Product import failed."
                        );


                alert(
                    errorMessage
                );

                return;

            }


            // ========================================
            // IMPORT SUCCESSFUL
            // ========================================

            importSummary.innerHTML = `
                <strong>
                    Import completed successfully.
                </strong>

                <br><br>

                <strong>
                    Products imported:
                </strong>
                ${data.importedCount}

                <br>

                <strong>
                    Categories created:
                </strong>
                ${data.categoriesCreated}

                <br>

                <strong>
                    Units created:
                </strong>
                ${data.unitsCreated}
            `;


            importSummary.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            // ========================================
            // CLEAR IMPORT STATE
            // ========================================

            validatedProducts = [];


            confirmImportButton.disabled =
                true;

            confirmImportButton.textContent =
                "Import Completed";


            // ========================================
            // CLEAR SELECTED CSV FILE
            // ========================================

            importFile.value = "";


        } catch (error) {

            console.error(
                "Product import error:",
                error
            );


            alert(
                "Unable to complete the product import. Please check the server."
            );


        } finally {

            // ========================================
            // RESTORE BUTTON IF IMPORT FAILED
            // ========================================

            if (
                validatedProducts.length > 0 &&
                confirmImportButton.disabled
            ) {

                confirmImportButton.disabled =
                    false;

                confirmImportButton.textContent =
                    "Confirm Import";

            }

        }

    }
);