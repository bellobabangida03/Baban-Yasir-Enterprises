// ========================================
// ADMIN AUTHENTICATION CHECK
// ========================================

const loggedInAdmin =
    sessionStorage.getItem("admin");

if (!loggedInAdmin) {

    window.location.href =
        "/admin/login.html";
}

const currentAdmin =
    JSON.parse(loggedInAdmin);

// ========================================
// GET CURRENT ADMIN
// ========================================

function getCurrentAdmin() {

    const admin =
        sessionStorage.getItem("admin");

    if (!admin) {
        window.location.href =
            "/admin/login.html";

        return null;
    }

    return JSON.parse(admin);
}

const productList = document.querySelector("#admin-product-list");
const addProductButton = document.querySelector("#add-product-button");

const otherCategoryGroup =
    document.querySelector("#other-category-group");

const otherUnitGroup =
    document.querySelector("#other-unit-group");

const adminProductSearch =
    document.querySelector("#admin-product-search");

const adminSearchClear =
    document.querySelector("#admin-search-clear");

// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Failed to load products.");
        }

        const products = await response.json();

        displayProducts(products);

    } catch (error) {

        console.error(error);

        productList.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load products.
                </td>
            </tr>
        `;

    }

}

// ========================================
// DISPLAY PRODUCTS
// ========================================

function displayProducts(products) {

    productList.innerHTML = "";

    products.forEach(function (product) {

        const row = document.createElement("tr");

        row.dataset.productId = product.id;

        row.innerHTML = `

            <td>
                <input
                    type="checkbox"
                    class="product-select-checkbox"
                    data-id="${product.id}"
                    title="Select product">
            </td>

            <td class="editable-cell"
                data-field="name"
                data-id="${product.id}">
                ${product.name}
            </td>

            <td class="editable-cell"
                data-field="category"
                data-id="${product.id}">
                ${product.category}
            </td>

            <td class="editable-cell"
                data-field="unit"
                data-id="${product.id}">
                ${product.unit}
            </td>

            <td class="editable-cell"
                data-field="price"
                data-id="${product.id}">
                ₦${Number(product.price).toLocaleString()}
            </td>

            <td>
                ${product.lastUpdated}
            </td>

            <td>
                <button
                    type="button"
                    class="delete-product-btn"
                    data-id="${product.id}"
                    data-name="${product.name}"
                    title="Delete product">
                    ✕
                </button>
            </td>

        `;

        productList.appendChild(row);

    });

    enableEditing();

    enableDeleting();

    enableProductSelection();

}

// ========================================
// INLINE EDITING
// ========================================

function enableEditing() {

    const editableCells =
        document.querySelectorAll(".editable-cell");


    editableCells.forEach(function (cell) {

        cell.addEventListener("click", async function () {

            // Prevent creating another editor
            if (
                cell.querySelector("input") ||
                cell.querySelector("select")
            ) {
                return;
            }


            const oldValue =
                cell.textContent.trim();

            const field =
                cell.dataset.field;


            // ========================================
            // CATEGORY DROPDOWN
            // ========================================

            if (field === "category") {

                const select =
                    document.createElement("select");

                select.classList.add(
                    "inline-edit-input"
                );

                try {

                    const response =
                        await fetch("/api/categories");

                    if (!response.ok) {
                        throw new Error(
                            "Unable to load categories."
                        );
                    }

                    const categories =
                        await response.json();


                    categories.forEach(
                        function (category) {

                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                category;

                            option.textContent =
                                category;

                            select.appendChild(
                                option
                            );

                        }
                    );


                    // Select current category
                    select.value =
                        oldValue;


                } catch (error) {

                    console.error(error);

                    alert(
                        "Unable to load categories."
                    );

                    return;

                }


                cell.innerHTML = "";

                cell.appendChild(select);

                select.focus();


                // Save when changed
                select.addEventListener(
                    "change",
                    function () {

                        saveInlineEdit(
                            cell,
                            select,
                            field
                        );

                    }
                );


                // Cancel with Escape
                select.addEventListener(
                    "keydown",
                    function (event) {

                        if (event.key === "Escape") {

                            cell.textContent =
                                oldValue;

                        }

                    }
                );


                return;
            }


            // ========================================
            // UNIT DROPDOWN
            // ========================================

            if (field === "unit") {

                const select =
                    document.createElement("select");

                select.classList.add(
                    "inline-edit-input"
                );

                try {

                    const response =
                        await fetch("/api/units");

                    if (!response.ok) {
                        throw new Error(
                            "Unable to load units."
                        );
                    }

                    const units =
                        await response.json();

                    units.forEach(function (unit) {

                        const option =
                            document.createElement("option");

                        option.value = unit;
                        option.textContent = unit;

                        select.appendChild(option);

                    });

                    // Select the product's current unit
                    select.value = oldValue;

                    /*
                     * If the current unit is not yet
                     * in units.json, keep it visible
                     * rather than losing the value.
                     */
                    if (select.value !== oldValue) {

                        const currentOption =
                            document.createElement("option");

                        currentOption.value = oldValue;
                        currentOption.textContent =
                            oldValue;

                        currentOption.selected = true;

                        select.appendChild(
                            currentOption
                        );
                    }

                } catch (error) {

                    console.error(error);

                    alert(
                        "Unable to load units."
                    );

                    return;
                }

                cell.innerHTML = "";

                cell.appendChild(select);

                select.focus();

                // Save when unit changes
                select.addEventListener(
                    "change",
                    function () {

                        saveInlineEdit(
                            cell,
                            select,
                            field
                        );

                    }
                );

                // Cancel with Escape
                select.addEventListener(
                    "keydown",
                    function (event) {

                        if (event.key === "Escape") {

                            cell.textContent =
                                oldValue;

                        }

                    }
                );

                return;
            }


            // ========================================
            // NAME / PRICE INPUT
            // ========================================

            const input =
                document.createElement("input");


            input.type =
                field === "price"
                    ? "number"
                    : "text";


            input.value =
                field === "price"
                    ? oldValue.replace(
                        /[₦,]/g,
                        ""
                    )
                    : oldValue;


            input.classList.add(
                "inline-edit-input"
            );


            cell.innerHTML = "";

            cell.appendChild(input);

            input.focus();

            input.select();


            // ========================================
            // KEYBOARD CONTROLS
            // ========================================

            input.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {

                        saveInlineEdit(
                            cell,
                            input,
                            field
                        );

                    }


                    if (event.key === "Escape") {

                        cell.textContent =
                            oldValue;

                    }

                }
            );


            // ========================================
            // SAVE WHEN CLICKING OUTSIDE
            // ========================================

            input.addEventListener(
                "blur",
                function () {

                    saveInlineEdit(
                        cell,
                        input,
                        field
                    );

                }
            );

        });

    });

}

// ========================================
// SAVE INLINE EDIT
// ========================================

async function saveInlineEdit(cell, input, field) {

    const newValue = input.value.trim();

    const productId = Number(cell.dataset.id);


    // ========================================
    // VALIDATION
    // ========================================

    if (newValue === "") {

        alert("This field cannot be empty.");

        input.focus();

        return;

    }


    if (field === "price" && Number(newValue) < 0) {

        alert("Price cannot be negative.");

        input.focus();

        return;

    }


    try {

        // Get the current product from the server
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Unable to load product.");
        }

        const products = await response.json();

        const product = products.find(
            item => item.id === productId
        );


        if (!product) {

            alert("Product not found.");

            return;

        }


        // Update only the field being edited
        product[field] =
            field === "price"
                ? Number(newValue)
                : newValue;


        // Send updated product to server
        const updateResponse = await fetch(
            `/api/products/${productId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "x-admin-session-token":
                        sessionStorage.getItem("adminSessionToken")
                },

                body: JSON.stringify({
                    name: product.name,
                    category: product.category,
                    unit: product.unit,
                    price: product.price,
                    admin: getCurrentAdmin()
                })
            }
        );


        if (!updateResponse.ok) {

            throw new Error(
                "Failed to update product."
            );

        }


        // Display the new value
        if (field === "price") {

            cell.textContent =
                `₦${Number(newValue).toLocaleString()}`;

        } else {

            cell.textContent = newValue;

        }


        console.log(
            `Product ${productId} updated successfully.`
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to save the change. Please try again."
        );

    }

}

// ========================================
// DELETE PRODUCTS
// ========================================

function enableDeleting() {

    const deleteButtons =
        document.querySelectorAll(".delete-product-btn");


    deleteButtons.forEach(function (button) {

        button.addEventListener("click", async function () {

            const productId =
                Number(button.dataset.id);

            const row =
                button.closest("tr");

            const productName =
                button.dataset.name;


            // ========================================
            // CONFIRM DELETION
            // ========================================

            const confirmed = confirm(
                `Are you sure you want to remove "${productName}"?`
            );


            if (!confirmed) {
                return;
            }


            try {

                const response = await fetch(
                    `/api/products/${productId}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",
                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            admin: getCurrentAdmin()
                        })
                    }
                );

                if (!response.ok) {

                    throw new Error(
                        "Failed to delete product."
                    );

                }


                // Remove the row from the page
                row.remove();


                console.log(
                    `Product ${productId} deleted successfully.`
                );


            } catch (error) {

                console.error(error);

                alert(
                    "Unable to delete the product. Please try again."
                );

            }

        });

    });

}

// ========================================
// ADD PRODUCT FORM
// ========================================

const addProductForm =
    document.querySelector("#add-product-form");

const newProductName =
    document.querySelector("#new-product-name");

const newProductCategory =
    document.querySelector("#new-product-category");

const newProductOtherCategory =
    document.querySelector(
        "#new-product-other-category"
    );

const newProductUnit =
    document.querySelector("#new-product-unit");

const newProductOtherUnit =
    document.querySelector(
        "#new-product-other-unit"
    );

const newProductPrice =
    document.querySelector("#new-product-price");

const cancelAddProduct =
    document.querySelector("#cancel-add-product");

const saveNewProduct =
    document.querySelector("#save-new-product");


// ========================================
// OPEN ADD PRODUCT FORM
// ========================================

addProductButton.addEventListener(
    "click",
    async function () {

        addProductForm.classList.add("visible");

        await loadCategoriesIntoProductForm();

        newProductName.focus();

    }
);


// ========================================
// LOAD CATEGORIES INTO DROPDOWN
// ========================================

async function loadCategoriesIntoProductForm() {

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

        newProductCategory.innerHTML = `

            <option value="">
                Select category
            </option>

        `;

        categories.forEach(
            function (category) {

                const option =
                    document.createElement("option");

                option.value = category;

                option.textContent = category;

                newProductCategory.appendChild(
                    option
                );

            }
        );


        const otherOption =
            document.createElement("option");

        otherOption.value = "__other__";

        otherOption.textContent =
            "Other...";

        newProductCategory.appendChild(
            otherOption
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load categories."
        );

    }

}


// ========================================
// CATEGORY OTHER OPTION
// ========================================
newProductCategory.addEventListener(
    "change",
    function () {

        if (newProductCategory.value === "__other__") {

            otherCategoryGroup.hidden = false;

            requestAnimationFrame(function () {
                newProductOtherCategory.focus();
            });

        } else {

            otherCategoryGroup.hidden = true;
            newProductOtherCategory.value = "";
        }
    }
);

// ========================================
// LOAD PRODUCT UNIT OPTIONS
// ========================================

async function loadProductUnitOptions() {

    try {

        const response =
            await fetch("/api/units");

        if (!response.ok) {
            throw new Error(
                "Unable to load units."
            );
        }

        const units =
            await response.json();

        newProductUnit.innerHTML =
            '<option value="">Select unit</option>';

        units.forEach(function (unit) {

            const option =
                document.createElement("option");

            option.value = unit;
            option.textContent = unit;

            newProductUnit.appendChild(
                option
            );

        });

        const otherOption =
            document.createElement("option");

        otherOption.value = "Other";
        otherOption.textContent = "Other...";

        newProductUnit.appendChild(
            otherOption
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load units."
        );
    }
}

// ========================================
// UNIT OTHER OPTION
// ========================================

newProductUnit.addEventListener(
    "change",
    function () {

        if (
            newProductUnit.value ===
            "Other"
        ) {

            otherUnitGroup.hidden = false;

            setTimeout(function () {
                newProductOtherUnit.focus();
            }, 0);

        } else {

            otherUnitGroup.hidden = true;

            newProductOtherUnit.value =
                "";

        }

    }
);

// ========================================
// LOAD UNIT MANAGEMENT
// ========================================

async function loadUnitManagement() {

    const unitList =
        document.querySelector("#unit-list");

    if (!unitList) {
        return;
    }

    try {

        const [unitsResponse, productsResponse] =
            await Promise.all([
                fetch("/api/units"),
                fetch("/api/products")
            ]);

        if (
            !unitsResponse.ok ||
            !productsResponse.ok
        ) {
            throw new Error(
                "Unable to load units or products."
            );
        }

        const units =
            await unitsResponse.json();

        const products =
            await productsResponse.json();

        unitList.innerHTML = "";

        units.forEach(function (unit) {

            const productCount =
                products.filter(
                    function (product) {
                        return (
                            product.unit.toLowerCase() ===
                            unit.toLowerCase()
                        );
                    }
                ).length;

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${unit}
                </td>

                <td>
                    ${productCount}
                </td>

                <td>
                    <button
                        type="button"
                        class="admin-btn danger delete-unit-button"
                        data-unit="${encodeURIComponent(unit)}">
                        Delete
                    </button>
                </td>
            `;

            unitList.appendChild(row);

        });

    } catch (error) {

        console.error(error);

        unitList.innerHTML = `
            <tr>
                <td colspan="3">
                    Unable to load units.
                </td>
            </tr>
        `;
    }
}

// ========================================
// CANCEL ADD PRODUCT
// ========================================

cancelAddProduct.addEventListener(
    "click",
    function () {

        addProductForm.classList.remove("visible");

        newProductName.value = "";

        newProductCategory.value = "";

        newProductOtherCategory.value = "";

        otherCategoryGroup.hidden =
            true;

        newProductUnit.value = "";

        newProductOtherUnit.value = "";

        otherUnitGroup.hidden =
            true;

        newProductPrice.value = "";

    }
);


// ========================================
// SAVE NEW PRODUCT
// ========================================

saveNewProduct.addEventListener(
    "click",
    async function () {
        const name =
            newProductName.value.trim();

        const selectedCategory =
            newProductCategory.value;

        let category =
            selectedCategory;

        let unit =
            newProductUnit.value;

        const price =
            newProductPrice.value.trim();

        const usingOtherCategory =
            selectedCategory === "__other__";

        if (usingOtherCategory) {

            category =
                newProductOtherCategory
                    .value
                    .trim();
        }


        // -------------------------------
        // GET CUSTOM UNIT
        // -------------------------------

        if (unit === "Other") {

            unit =
                newProductOtherUnit
                    .value
                    .trim();

        }


        // -------------------------------
        // VALIDATION
        // -------------------------------

        if (!name) {

            alert(
                "Please enter a product name."
            );

            newProductName.focus();

            return;

        }


        if (!category) {

            alert(
                "Please select or enter a category."
            );

            return;

        }


        if (!unit) {

            alert(
                "Please select or enter a unit."
            );

            return;

        }


        if (
            price === "" ||
            isNaN(Number(price)) ||
            Number(price) < 0
        ) {

            alert(
                "Please enter a valid price."
            );

            newProductPrice.focus();

            return;

        }

        try {

            // ========================================
            // SAVE NEW CATEGORY IF "OTHER..." WAS USED
            // ========================================

            if (usingOtherCategory) {

                const categoryResponse =
                    await fetch(
                        "/api/categories",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                                "x-admin-session-token":
                                    sessionStorage.getItem(
                                        "adminSessionToken"
                                    )
                            },

                            body: JSON.stringify({
                                category: category,
                                admin: getCurrentAdmin()
                            })
                        }
                    );

                const categoryData =
                    await categoryResponse.json();

                if (
                    !categoryResponse.ok &&
                    categoryResponse.status !== 409
                ) {

                    throw new Error(
                        categoryData.message ||
                        "Unable to save the new category."
                    );

                }

            }


            // ========================================
            // ADD PRODUCT
            // ========================================

            const response =
                await fetch(
                    "/api/products",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            name: name,
                            category: category,
                            unit: unit,
                            price: Number(price),
                            admin: getCurrentAdmin()
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to add product."
                );

            }


            alert(
                "Product added successfully."
            );


            // Close and reset form
            cancelAddProduct.click();


            // Refresh product table
            loadProducts();


            // Refresh category counts
            loadCategories();


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to add the product."
            );

        }

    }
);

// ========================================
// ADMIN PRODUCT SEARCH
// ========================================

adminProductSearch.addEventListener("input", function () {

    const searchText =
        adminProductSearch.value.trim().toLowerCase();

    const rows =
        productList.querySelectorAll("tr");

    rows.forEach(function (row) {

        const rowText =
            row.textContent.toLowerCase();

        if (rowText.includes(searchText)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

});

// ========================================
// CLEAR ADMIN SEARCH
// ========================================

adminSearchClear.addEventListener("click", function () {

    adminProductSearch.value = "";

    const rows =
        productList.querySelectorAll("tr");

    rows.forEach(function (row) {

        row.style.display = "";

    });

    adminProductSearch.focus();

});

// ========================================
// START
// ========================================

loadProducts();
loadProductUnitOptions();
loadUnitManagement();

// ========================================
// CATEGORY MANAGEMENT
// ========================================

const categoryList =
    document.querySelector("#admin-category-list");

const addCategoryButton =
    document.querySelector("#add-category-button");


// ========================================
// UNIT MANAGEMENT
// ========================================

const addUnitButton =
    document.querySelector("#add-unit-button");

const newUnitName =
    document.querySelector("#new-unit-name");

const unitList =
    document.querySelector("#unit-list");

// ========================================
// LOAD CATEGORIES
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

        displayCategories(categories);

    } catch (error) {

        console.error(error);

        categoryList.innerHTML = `

            <tr>

                <td colspan="3">
                    Unable to load categories.
                </td>

            </tr>

        `;

    }

}


// ========================================
// DISPLAY CATEGORIES
// ========================================

async function displayCategories(categories) {

    categoryList.innerHTML = "";

    try {

        const response =
            await fetch("/api/products");

        if (!response.ok) {

            throw new Error(
                "Failed to load products."
            );

        }

        const products =
            await response.json();

        categories.forEach(function (category) {

            const productCount =
                products.filter(function (product) {

                    return product.category.toLowerCase() ===
                        category.toLowerCase();

                }).length;


            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${category}
                </td>

                <td class="category-product-count">
                    ${productCount}
                </td>

                <td>

                    <button
                        type="button"
                        class="delete-category-btn"
                        data-category="${category}"
                        title="Delete category">

                        ✕

                    </button>

                </td>

            `;

            categoryList.appendChild(row);

        });

        enableCategoryDeleting();

    } catch (error) {

        console.error(error);

    }

}


// ========================================
// ADD CATEGORY
// ========================================

addCategoryButton.addEventListener(
    "click",
    async function () {

        const category =
            prompt("Enter the new category name:");

        if (category === null) {
            return;
        }

        const categoryName =
            category.trim();

        if (categoryName === "") {

            alert(
                "Category name cannot be empty."
            );

            return;

        }


        try {

            const response =
                await fetch("/api/categories", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "x-admin-session-token":
                            sessionStorage.getItem(
                                "adminSessionToken"
                            )
                    },

                    body: JSON.stringify({
                        category: categoryName,
                        admin: getCurrentAdmin()
                    })

                });


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Unable to add category."
                );

                return;

            }


            alert(
                "Category added successfully."
            );

            loadCategories();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to add the category."
            );

        }

    }
);


// ========================================
// DELETE CATEGORY
// ========================================

function enableCategoryDeleting() {

    const deleteButtons =
        document.querySelectorAll(
            ".delete-category-btn"
        );


    deleteButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const category =
                        button.dataset.category;


                    const confirmed =
                        confirm(
                            `Are you sure you want to delete "${category}"?`
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {
                        const response =
                            await fetch(
                                `/api/categories/${encodeURIComponent(category)}`,
                                {
                                    method: "DELETE",

                                    headers: {
                                        "Content-Type":
                                            "application/json",

                                        "x-admin-session-token":
                                            sessionStorage.getItem(
                                                "adminSessionToken"
                                            )
                                    },

                                    body: JSON.stringify({
                                        admin:
                                            getCurrentAdmin()
                                    })
                                }
                            );


                        const data =
                            await response.json();


                        if (!response.ok) {

                            alert(
                                data.message ||
                                "Unable to delete category."
                            );

                            return;

                        }


                        alert(
                            "Category deleted successfully."
                        );


                        loadCategories();


                    } catch (error) {

                        console.error(error);

                        alert(
                            "Unable to delete the category."
                        );

                    }

                }
            );

        }
    );

}


// ========================================
// START CATEGORY MANAGEMENT
// ========================================

loadCategories();

// ========================================
// ADD UNIT
// ========================================

addUnitButton.addEventListener(
    "click",
    async function () {

        const unit =
            newUnitName.value.trim();

        if (unit === "") {

            alert(
                "Please enter a unit name."
            );

            newUnitName.focus();

            return;
        }

        try {

            const response =
                await fetch("/api/units", {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-admin-session-token":
                            sessionStorage.getItem(
                                "adminSessionToken"
                            )
                    },

                    body: JSON.stringify({
                        unit: unit,
                        admin: getCurrentAdmin()
                    })
                });

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to add unit."
                );
            }

            alert(
                `"${data.unit}" added successfully.`
            );

            newUnitName.value = "";

            await loadUnitManagement();

            // Refresh all unit dropdowns
            await loadProductUnitOptions();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to add unit."
            );
        }
    }
);

// ========================================
// DELETE UNIT
// ========================================

unitList.addEventListener(
    "click",
    async function (event) {

        const deleteButton =
            event.target.closest(
                ".delete-unit-button"
            );

        if (!deleteButton) {
            return;
        }

        const encodedUnit =
            deleteButton.dataset.unit;

        const unit =
            decodeURIComponent(
                encodedUnit
            );

        const confirmed =
            confirm(
                `Are you sure you want to delete "${unit}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    `/api/units/${encodedUnit}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            admin:
                                getCurrentAdmin()
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete unit."
                );
            }

            alert(
                `"${unit}" deleted successfully.`
            );

            await loadUnitManagement();

            // Refresh unit dropdowns
            await loadProductUnitOptions();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to delete unit."
            );
        }
    }
);

// ========================================
// BULK PRODUCT SELECTION
// ========================================

const selectAllProducts =
    document.querySelector("#select-all-products");

const bulkActionsToolbar =
    document.querySelector("#bulk-actions-toolbar");

const selectedProductCount =
    document.querySelector("#selected-product-count");

const bulkCancelSelection =
    document.querySelector("#bulk-cancel-selection");

function enableProductSelection() {

    const checkboxes =
        document.querySelectorAll(
            ".product-select-checkbox"
        );

    checkboxes.forEach(function (checkbox) {

        checkbox.addEventListener(
            "change",
            function () {

                const row =
                    checkbox.closest("tr");

                if (checkbox.checked) {

                    row.classList.add(
                        "product-row-selected"
                    );

                } else {

                    row.classList.remove(
                        "product-row-selected"
                    );
                }

                updateBulkSelection();
            }
        );
    });


    // ========================================
    // MOBILE LONG-PRESS SELECTION
    // ========================================

    const rows =
        document.querySelectorAll(
            ".admin-product-table tbody tr"
        );

    rows.forEach(function (row) {

        let pressTimer = null;
        let longPressTriggered = false;


        row.addEventListener(
            "pointerdown",
            function (event) {

                // Ignore the checkbox itself
                if (
                    event.target.closest(
                        ".product-select-checkbox"
                    )
                ) {
                    return;
                }

                longPressTriggered = false;

                pressTimer = setTimeout(
                    function () {

                        longPressTriggered = true;

                        const checkbox =
                            row.querySelector(
                                ".product-select-checkbox"
                            );

                        if (!checkbox) {
                            return;
                        }

                        checkbox.checked =
                            !checkbox.checked;

                        if (checkbox.checked) {

                            row.classList.add(
                                "product-row-selected"
                            );

                        } else {

                            row.classList.remove(
                                "product-row-selected"
                            );
                        }

                        updateBulkSelection();

                    },
                    600
                );
            }
        );


        row.addEventListener(
            "pointerup",
            function () {

                clearTimeout(pressTimer);
            }
        );


        row.addEventListener(
            "pointerleave",
            function () {

                clearTimeout(pressTimer);
            }
        );


        row.addEventListener(
            "pointercancel",
            function () {

                clearTimeout(pressTimer);
            }
        );


        row.addEventListener(
            "click",
            function (event) {

                if (longPressTriggered) {

                    event.preventDefault();

                    longPressTriggered = false;
                }
            }
        );
    });
}

function updateBulkSelection() {

    const selected =
        document.querySelectorAll(
            ".product-select-checkbox:checked"
        );

    selectedProductCount.textContent =
        selected.length;

    if (selected.length > 0) {

        bulkActionsToolbar.hidden = false;

    } else {

        bulkActionsToolbar.hidden = true;

    }

    if (selectAllProducts) {

        const allCheckboxes =
            document.querySelectorAll(
                ".product-select-checkbox"
            );

        selectAllProducts.checked =
            allCheckboxes.length > 0 &&
            selected.length === allCheckboxes.length;
    }

}

if (selectAllProducts) {

    selectAllProducts.addEventListener(
        "change",
        function () {

            const checkboxes =
                document.querySelectorAll(
                    ".product-select-checkbox"
                );

            checkboxes.forEach(function (checkbox) {

                checkbox.checked =
                    selectAllProducts.checked;

                const row =
                    checkbox.closest("tr");

                if (checkbox.checked) {

                    row.classList.add(
                        "product-row-selected"
                    );

                } else {

                    row.classList.remove(
                        "product-row-selected"
                    );

                }

            });

            updateBulkSelection();

        }
    );

}

if (bulkCancelSelection) {

    bulkCancelSelection.addEventListener(
        "click",
        function () {

            const checkboxes =
                document.querySelectorAll(
                    ".product-select-checkbox"
                );

            checkboxes.forEach(function (checkbox) {

                checkbox.checked = false;

                const row =
                    checkbox.closest("tr");

                row.classList.remove(
                    "product-row-selected"
                );

            });

            if (selectAllProducts) {
                selectAllProducts.checked = false;
            }

            updateBulkSelection();

        }
    );

}

// ========================================
// BULK MOVE CATEGORY
// ========================================

const bulkMoveCategoryButton =
    document.querySelector("#bulk-move-category");

const bulkMoveDialog =
    document.querySelector("#bulk-move-dialog");

const bulkMoveCategorySelect =
    document.querySelector("#bulk-move-category-select");

const bulkOtherCategoryGroup =
    document.querySelector("#bulk-other-category-group");

const bulkMoveOtherCategory =
    document.querySelector("#bulk-move-other-category");

const cancelBulkMove =
    document.querySelector("#cancel-bulk-move");

const confirmBulkMove =
    document.querySelector("#confirm-bulk-move");

async function loadCategoriesIntoBulkMove() {

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

        bulkMoveCategorySelect.innerHTML = `
            <option value="">
                Select category
            </option>
        `;

        categories.forEach(function (category) {

            const option =
                document.createElement("option");

            option.value = category;
            option.textContent = category;

            bulkMoveCategorySelect.appendChild(
                option
            );

        });

        const otherOption =
            document.createElement("option");

        otherOption.value = "__other__";
        otherOption.textContent = "Other...";

        bulkMoveCategorySelect.appendChild(
            otherOption
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load categories."
        );

    }

}

bulkMoveCategoryButton.addEventListener(
    "click",
    async function () {

        const selected =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selected.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }

        await loadCategoriesIntoBulkMove();

        bulkMoveCategorySelect.value = "";

        bulkOtherCategoryGroup.hidden = true;

        bulkMoveOtherCategory.value = "";

        bulkMoveDialog.hidden = false;

    }
);

bulkMoveCategorySelect.addEventListener(
    "change",
    function () {

        if (
            bulkMoveCategorySelect.value ===
            "__other__"
        ) {

            bulkOtherCategoryGroup.hidden = false;

            requestAnimationFrame(function () {

                bulkMoveOtherCategory.focus();

            });

        } else {

            bulkOtherCategoryGroup.hidden = true;

            bulkMoveOtherCategory.value = "";

        }

    }
);

cancelBulkMove.addEventListener(
    "click",
    function () {

        bulkMoveDialog.hidden = true;

        bulkMoveCategorySelect.value = "";

        bulkOtherCategoryGroup.hidden = true;

        bulkMoveOtherCategory.value = "";

    }
);

// ========================================
// CONFIRM BULK MOVE
// ========================================

confirmBulkMove.addEventListener(
    "click",
    async function () {

        const selectedCheckboxes =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selectedCheckboxes.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }

        let category =
            bulkMoveCategorySelect.value;

        if (category === "__other__") {

            category =
                bulkMoveOtherCategory
                    .value
                    .trim();

            if (!category) {

                alert(
                    "Please enter a category."
                );

                bulkMoveOtherCategory.focus();

                return;
            }

        }

        if (!category) {

            alert(
                "Please select a category."
            );

            return;
        }

        const productIds =
            Array.from(
                selectedCheckboxes
            ).map(function (checkbox) {

                return checkbox.dataset.id;

            });

        const confirmed =
            confirm(
                `Move ${productIds.length} selected product(s) to "${category}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            // ========================================
            // SAVE NEW CATEGORY IF "OTHER..." WAS USED
            // ========================================

            if (
                bulkMoveCategorySelect.value ===
                "__other__"
            ) {

                const categoryResponse =
                    await fetch(
                        "/api/categories",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                category:
                                    category,
                                admin:
                                    getCurrentAdmin()
                            })
                        }
                    );

                const categoryData =
                    await categoryResponse.json();

                if (
                    !categoryResponse.ok &&
                    categoryResponse.status !== 409
                ) {

                    throw new Error(
                        categoryData.message ||
                        "Unable to save the new category."
                    );

                }

            }

            // ========================================
            // MOVE PRODUCTS
            // ========================================

            const response =
                await fetch(
                    "/api/products/bulk/category",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            productIds:
                                productIds,
                            category:
                                category,
                            admin:
                                getCurrentAdmin()
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to move products."
                );

            }

            alert(
                `${data.updatedCount} product(s) moved successfully.`
            );

            // Close dialog
            bulkMoveDialog.hidden = true;

            // Clear category dialog
            bulkMoveCategorySelect.value = "";

            bulkOtherCategoryGroup.hidden =
                true;

            bulkMoveOtherCategory.value =
                "";

            // Clear product selections
            if (selectAllProducts) {
                selectAllProducts.checked =
                    false;
            }

            selectedCheckboxes.forEach(
                function (checkbox) {

                    checkbox.checked =
                        false;

                    const row =
                        checkbox.closest("tr");

                    row.classList.remove(
                        "product-row-selected"
                    );

                }
            );

            updateBulkSelection();

            // Reload products and categories
            await loadProducts();

            await loadCategories();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to move products."
            );

        }

    }
);

// ========================================
// BULK CHANGE PRICE
// ========================================

const bulkChangePriceButton =
    document.querySelector("#bulk-change-price");

const bulkPriceDialog =
    document.querySelector("#bulk-price-dialog");

const bulkNewPrice =
    document.querySelector("#bulk-new-price");

const cancelBulkPrice =
    document.querySelector("#cancel-bulk-price");

const confirmBulkPrice =
    document.querySelector("#confirm-bulk-price");

bulkChangePriceButton.addEventListener(
    "click",
    function () {

        const selected =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selected.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }

        bulkNewPrice.value = "";

        bulkPriceDialog.hidden = false;

        requestAnimationFrame(function () {
            bulkNewPrice.focus();
        });

    }
);

cancelBulkPrice.addEventListener(
    "click",
    function () {

        bulkPriceDialog.hidden = true;

        bulkNewPrice.value = "";

    }
);

// ========================================
// CONFIRM BULK PRICE CHANGE
// ========================================

confirmBulkPrice.addEventListener(
    "click",
    async function () {

        const selectedCheckboxes =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selectedCheckboxes.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }

        const price =
            bulkNewPrice.value.trim();

        if (
            price === "" ||
            isNaN(Number(price)) ||
            Number(price) < 0
        ) {

            alert(
                "Please enter a valid price."
            );

            bulkNewPrice.focus();

            return;
        }

        const productIds =
            Array.from(
                selectedCheckboxes
            ).map(function (checkbox) {

                return checkbox.dataset.id;

            });

        const confirmed =
            confirm(
                `Change the price of ${productIds.length} selected product(s) to ₦${Number(price).toLocaleString()}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    "/api/products/bulk/price",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            productIds:
                                productIds,
                            price:
                                Number(price),
                            admin:
                                getCurrentAdmin()
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to change prices."
                );

            }

            alert(
                `${data.updatedCount} product(s) updated successfully.`
            );

            // Close dialog
            bulkPriceDialog.hidden = true;

            bulkNewPrice.value = "";

            // Clear selections
            if (selectAllProducts) {
                selectAllProducts.checked = false;
            }

            selectedCheckboxes.forEach(
                function (checkbox) {

                    checkbox.checked = false;

                    const row =
                        checkbox.closest("tr");

                    row.classList.remove(
                        "product-row-selected"
                    );

                }
            );

            updateBulkSelection();

            // Reload products
            await loadProducts();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to change prices."
            );

        }

    }
);

// ========================================
// BULK CHANGE UNIT ELEMENTS
// ========================================

const bulkChangeUnit =
    document.querySelector("#bulk-change-unit");

const bulkUnitDialog =
    document.querySelector("#bulk-unit-dialog");

const bulkUnitSelect =
    document.querySelector("#bulk-unit-select");

const bulkOtherUnitGroup =
    document.querySelector("#bulk-other-unit-group");

const bulkOtherUnit =
    document.querySelector("#bulk-other-unit");

const cancelBulkUnit =
    document.querySelector("#cancel-bulk-unit");

const confirmBulkUnit =
    document.querySelector("#confirm-bulk-unit");

// ========================================
// CANCEL BULK UNIT
// ========================================

cancelBulkUnit.addEventListener(
    "click",
    function () {

        bulkUnitDialog.hidden = true;

        bulkUnitSelect.value = "";

        bulkOtherUnit.value = "";

        bulkOtherUnitGroup.hidden = true;

    }
);

// ========================================
// CONFIRM BULK UNIT CHANGE
// ========================================

confirmBulkUnit.addEventListener(
    "click",
    async function () {

        const selectedCheckboxes =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selectedCheckboxes.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }

        let unit =
            bulkUnitSelect.value;

        // ========================================
        // HANDLE OTHER UNIT
        // ========================================

        if (unit === "__other__") {

            unit =
                bulkOtherUnit.value.trim();

            if (unit === "") {

                alert(
                    "Please enter the new unit."
                );

                bulkOtherUnit.focus();

                return;
            }
        }

        if (unit === "") {

            alert(
                "Please select a unit."
            );

            bulkUnitSelect.focus();

            return;
        }

        const productIds =
            Array.from(
                selectedCheckboxes
            ).map(function (checkbox) {

                return checkbox.dataset.id;

            });

        const confirmed =
            confirm(
                `Change the unit of ${productIds.length} selected product(s) to "${unit}"?`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    "/api/products/bulk/unit",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            productIds:
                                productIds,

                            unit:
                                unit,

                            admin:
                                getCurrentAdmin()
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to change units."
                );

            }

            alert(
                `${data.updatedCount} product(s) updated successfully.`
            );

            // ========================================
            // CLOSE DIALOG
            // ========================================

            bulkUnitDialog.hidden = true;

            bulkUnitSelect.value = "";

            bulkOtherUnit.value = "";

            bulkOtherUnitGroup.hidden = true;


            // ========================================
            // CLEAR SELECTION
            // ========================================

            if (selectAllProducts) {

                selectAllProducts.checked =
                    false;

            }

            selectedCheckboxes.forEach(
                function (checkbox) {

                    checkbox.checked =
                        false;

                    const row =
                        checkbox.closest("tr");

                    row.classList.remove(
                        "product-row-selected"
                    );

                }
            );

            updateBulkSelection();


            // ========================================
            // RELOAD PRODUCTS
            // ========================================

            await loadProducts();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to change units."
            );

        }

    }
);

// ========================================
// LOAD BULK UNIT OPTIONS
// ========================================

async function loadBulkUnitOptions() {

    try {

        const response =
            await fetch("/api/units");

        if (!response.ok) {
            throw new Error(
                "Unable to load units."
            );
        }

        const units =
            await response.json();

        bulkUnitSelect.innerHTML =
            '<option value="">Select unit</option>';

        units.forEach(function (unit) {

            const option =
                document.createElement("option");

            option.value = unit;
            option.textContent = unit;

            bulkUnitSelect.appendChild(
                option
            );

        });

        // Add Other... separately
        const otherOption =
            document.createElement("option");

        otherOption.value = "__other__";
        otherOption.textContent = "Other...";

        bulkUnitSelect.appendChild(
            otherOption
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load units."
        );
    }
}

bulkChangeUnit.addEventListener(
    "click",
    function () {

        const selected =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selected.length === 0) {

            alert("Please select at least one product.");

            return;
        }

        loadBulkUnitOptions();

        bulkUnitSelect.value = "";

        bulkOtherUnitGroup.hidden = true;

        bulkOtherUnit.value = "";

        bulkUnitDialog.hidden = false;

        bulkUnitSelect.focus();
    }
);
bulkUnitSelect.addEventListener(
    "change",
    function () {

        if (bulkUnitSelect.value === "__other__") {

            bulkOtherUnitGroup.hidden = false;

            requestAnimationFrame(function () {
                bulkOtherUnit.focus();
            });

        } else {

            bulkOtherUnitGroup.hidden = true;

            bulkOtherUnit.value = "";
        }
    }
);

// ========================================
// CANCEL BULK UNIT
// ========================================

cancelBulkUnit.addEventListener(
    "click",
    function () {

        bulkUnitDialog.hidden = true;

        bulkUnitSelect.value = "";

        bulkOtherUnit.value = "";

        bulkOtherUnitGroup.hidden = true;

    }
);

// ========================================
// BULK DELETE PRODUCTS
// ========================================

const bulkDeleteProducts =
    document.querySelector("#bulk-delete-products");


bulkDeleteProducts.addEventListener(
    "click",
    async function () {

        const selectedCheckboxes =
            document.querySelectorAll(
                ".product-select-checkbox:checked"
            );

        if (selectedCheckboxes.length === 0) {

            alert(
                "Please select at least one product."
            );

            return;
        }

        const productIds =
            Array.from(
                selectedCheckboxes
            ).map(function (checkbox) {

                return checkbox.dataset.id;

            });

        const confirmed =
            confirm(
                `Are you sure you want to permanently delete ${productIds.length} selected product(s)?\n\nThis action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    "/api/products/bulk",
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-admin-session-token":
                                sessionStorage.getItem(
                                    "adminSessionToken"
                                )
                        },

                        body: JSON.stringify({
                            productIds:
                                productIds,
                            admin:
                                getCurrentAdmin()
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete products."
                );

            }

            alert(
                `${data.deletedCount} product(s) deleted successfully.`
            );

            // Clear selection
            if (selectAllProducts) {
                selectAllProducts.checked = false;
            }

            updateBulkSelection();

            // Reload products
            await loadProducts();

            // Refresh category counts
            await loadCategories();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Unable to delete products."
            );

        }

    }
);

// ========================================
// DASHBOARD CARD NAVIGATION
// ========================================

const manageProductsButton =
    document.querySelector("#manage-products-button");

const manageCategoriesButton =
    document.querySelector("#manage-categories-button");

const manageUnitsButton =
    document.querySelector("#manage-units-button");

const managePricesButton =
    document.querySelector("#manage-prices-button");

const viewPriceHistoryButton =
    document.querySelector("#view-price-history-button");

const viewAdminActivityButton =
    document.querySelector("#view-admin-activity-button");


// ========================================
// MANAGE PRODUCTS
// ========================================

if (manageProductsButton) {

    manageProductsButton.addEventListener(
        "click",
        function () {

            const productManagement =
                document.querySelector("#product-management");

            if (productManagement) {

                productManagement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );

}


// ========================================
// MANAGE CATEGORIES
// ========================================

if (manageCategoriesButton) {

    manageCategoriesButton.addEventListener(
        "click",
        function () {

            const categoryManagement =
                document.querySelector("#category-management");

            if (categoryManagement) {

                categoryManagement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );

}

// ========================================
// MANAGE UNITS
// ========================================

if (manageUnitsButton) {

    manageUnitsButton.addEventListener(
        "click",
        function () {

            const unitManagement =
                document.querySelector("#unit-management");

            if (unitManagement) {

                unitManagement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );

}

// ========================================
// MANAGE PRICES
// ========================================

if (managePricesButton) {

    managePricesButton.addEventListener(
        "click",
        function () {

            const productManagement =
                document.querySelector("#product-management");

            if (productManagement) {

                productManagement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );

}


// ========================================
// VIEW PRICE HISTORY
// ========================================

if (viewPriceHistoryButton) {

    viewPriceHistoryButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/admin/price-history.html";

        }
    );

}


// ========================================
// VIEW ADMIN ACTIVITY
// ========================================

if (viewAdminActivityButton) {

    viewAdminActivityButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "/admin/history.html";

        }
    );

}