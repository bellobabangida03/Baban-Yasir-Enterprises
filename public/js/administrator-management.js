// ========================================
// ADMINISTRATOR MANAGEMENT
// ========================================

const administratorManagementCard =
    document.querySelector(
        "#administrator-management-card"
    );

const administratorManagementSection =
    document.querySelector(
        "#administrator-management"
    );

const manageAdministratorsButton =
    document.querySelector(
        "#manage-administrators-button"
    );

const addAdministratorButton =
    document.querySelector(
        "#add-administrator-button"
    );

const administratorList =
    document.querySelector(
        "#administrator-list"
    );

const administratorModal =
    document.querySelector(
        "#administrator-modal"
    );

const administratorModalTitle =
    document.querySelector(
        "#administrator-modal-title"
    );

const administratorModalDescription =
    document.querySelector(
        "#administrator-modal-description"
    );

const administratorModalBody =
    document.querySelector(
        "#administrator-modal-body"
    );

const administratorModalClose =
    document.querySelector(
        "#administrator-modal-close"
    )


// ========================================
// GET CURRENT ADMIN
// ========================================

const administratorCurrentAdmin =
    JSON.parse(
        sessionStorage.getItem("admin")
    );

const administratorSessionToken =
    sessionStorage.getItem(
        "adminSessionToken"
    );


// ========================================
// CHECK SUPER ADMIN
// ========================================

if (
    administratorCurrentAdmin &&
    administratorCurrentAdmin.role === "superadmin" &&
    administratorSessionToken
) {

    // Show Super Admin card
    administratorManagementCard.hidden =
        false;

} else {

    // Normal admins do not see
    // administrator management.
    administratorManagementCard.hidden =
        true;

    administratorManagementSection.hidden =
        true;
}


// ========================================
// OPEN ADMINISTRATOR MANAGEMENT
// ========================================

manageAdministratorsButton.addEventListener(
    "click",
    function () {

        administratorManagementSection.hidden =
            false;

        administratorManagementSection
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        loadAdministrators();
    }
);

// ========================================
// ADD ADMINISTRATOR
// ========================================

addAdministratorButton.addEventListener(
    "click",
    function () {

        addAdministrator();

    }
);


// ========================================
// LOAD ADMINISTRATORS
// ========================================

async function loadAdministrators() {

    try {

        const response =
            await fetch(
                "/api/admin/administrators",
                {
                    method: "GET",

                    headers: {
                        "x-admin-session-token":
                            administratorSessionToken
                    }
                }
            );

        const data =
            await response.json();


        // ========================================
        // HANDLE ACCESS ERROR
        // ========================================

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load administrators."
            );

            return;
        }


        // ========================================
        // CLEAR EXISTING ROWS
        // ========================================

        administratorList.innerHTML =
            "";


        // ========================================
        // DISPLAY ADMINISTRATORS
        // ========================================

        data.forEach(function (admin) {

            const row =
                document.createElement("tr");


            // ========================================
            // STATUS
            // ========================================

            const statusText =
                admin.active
                    ? "Active"
                    : "Disabled";


            // ========================================
            // ACTION
            // ========================================

            let actionHTML = "";


            if (admin.role === "superadmin") {

                actionHTML = `
                    <span>
                        Protected
                    </span>
                `;

            } else {

                actionHTML = `
                    <button
                        type="button"
                        class="admin-btn administrator-manage-button"
                        data-admin-id="${admin.id}"
                    >
                        Manage
                    </button>
                `;

            }


            // ========================================
            // BUILD ROW
            // ========================================

            row.innerHTML = `

                <td>
                    ${admin.id}
                </td>

                <td>
                    ${admin.name}
                </td>

                <td>
                    ${admin.email}
                </td>

                <td>
                    ${admin.role}
                </td>

                <td>
                    ${statusText}
                </td>

                <td>
                    ${actionHTML}
                </td>

            `;


            administratorList.appendChild(row);

        });


        // ========================================
        // MANAGE ADMINISTRATOR BUTTONS
        // ========================================

        const manageButtons =
            document.querySelectorAll(
                ".administrator-manage-button"
            );


        manageButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const administratorId =
                        Number(
                            button.dataset.adminId
                        );


                    const administrator =
                        data.find(function (admin) {

                            return Number(admin.id) ===
                                administratorId;

                        });


                    if (!administrator) {

                        alert(
                            "Administrator not found."
                        );

                        return;
                    }


                    showAdministratorControls(
                        administrator
                    );

                }
            );

        });


    } catch (error) {

        console.error(
            "Administrator loading error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}


// ========================================
// SHOW ADMINISTRATOR CONTROLS
// ========================================

function showAdministratorControls(
    administrator
) {

    administratorModalTitle.textContent =
        `Manage ${administrator.name}`;

    administratorModalDescription.textContent =
        `${administrator.email} • ${administrator.role === "superadmin"
            ? "Super Admin"
            : "Administrator"
        }`;

    administratorModalBody.innerHTML = `
        <div class="admin-modal-actions">

            <button
                type="button"
                class="admin-modal-button-primary"
                id="modal-edit-administrator"
            >
                Edit Details
            </button>

            <button
                type="button"
                class="${administrator.active
            ? "admin-modal-button-warning"
            : "admin-modal-button-success"
        }"
                id="modal-toggle-administrator"
            >
                ${administrator.active
            ? "Disable Account"
            : "Enable Account"
        }
            </button>

            <button
                type="button"
                class="admin-modal-button-secondary"
                id="modal-reset-administrator-password"
            >
                Reset Password
            </button>

            ${administrator.active === true &&
            administrator.role === "admin"
            ? `
                        <button
                            type="button"
                            class="admin-modal-button-warning"
                            id="modal-transfer-superadmin"
                        >
                            Transfer Super Admin
                        </button>
                    `
            : ""
        }

            ${administrator.active === false &&
            administrator.role === "admin"
            ? `
                        <button
                            type="button"
                            class="admin-modal-button-danger"
                            id="modal-remove-administrator"
                        >
                            Remove Administrator
                        </button>
                    `
            : ""
        }

        </div>
    `;

    administratorModal.hidden = false;


    // ========================================
    // EDIT DETAILS
    // ========================================

    document
        .querySelector(
            "#modal-edit-administrator"
        )
        .addEventListener(
            "click",
            function () {

                editAdministrator(
                    administrator
                );
            }
        );


    // ========================================
    // ENABLE / DISABLE
    // ========================================

    document
        .querySelector(
            "#modal-toggle-administrator"
        )
        .addEventListener(
            "click",
            function () {

                updateAdministratorStatus(
                    administrator,
                    !administrator.active
                );
            }
        );


    // ========================================
    // RESET PASSWORD
    // ========================================

    document
        .querySelector(
            "#modal-reset-administrator-password"
        )
        .addEventListener(
            "click",
            function () {

                resetAdministratorPassword(
                    administrator
                );
            }
        );


    // ========================================
    // TRANSFER SUPER ADMIN
    // ========================================

    const transferButton =
        document.querySelector(
            "#modal-transfer-superadmin"
        );

    if (transferButton) {

        transferButton.addEventListener(
            "click",
            function () {

                transferSuperAdmin(
                    administrator
                );
            }
        );
    }


    // ========================================
    // REMOVE ADMINISTRATOR
    // ========================================

    const removeButton =
        document.querySelector(
            "#modal-remove-administrator"
        );

    if (removeButton) {

        removeButton.addEventListener(
            "click",
            function () {

                removeAdministrator(
                    administrator
                );
            }
        );
    }
}


// ========================================
// EDIT ADMINISTRATOR
// ========================================

function editAdministrator(
    administrator
) {

    administratorModalTitle.textContent =
        "Edit Administrator";

    administratorModalDescription.textContent =
        `Update the details for ${administrator.name}.`;

    administratorModalBody.innerHTML = `
        <form
            class="admin-modal-form"
            id="edit-administrator-form"
        >

            <label>
                Name

                <input
                    type="text"
                    id="edit-administrator-name"
                    value="${administrator.name}"
                    required
                >
            </label>

            <label>
                Email

                <input
                    type="email"
                    id="edit-administrator-email"
                    value="${administrator.email}"
                    required
                >
            </label>

            <div class="admin-modal-actions">

                <button
                    type="submit"
                    class="admin-modal-button-primary"
                >
                    Save Changes
                </button>

                <button
                    type="button"
                    class="admin-modal-button-secondary"
                    id="cancel-edit-administrator"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    const form =
        document.querySelector(
            "#edit-administrator-form"
        );

    const cancelButton =
        document.querySelector(
            "#cancel-edit-administrator"
        );

    cancelButton.addEventListener(
        "click",
        function () {

            showAdministratorControls(
                administrator
            );
        }
    );

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document
                    .querySelector(
                        "#edit-administrator-name"
                    )
                    .value
                    .trim();

            const email =
                document
                    .querySelector(
                        "#edit-administrator-email"
                    )
                    .value
                    .trim();

            if (!name || !email) {

                alert(
                    "Name and email are required."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        `/api/admin/administrators/${administrator.id}`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-admin-session-token":
                                    administratorSessionToken
                            },

                            body: JSON.stringify({
                                name,
                                email
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to update administrator."
                    );

                    return;
                }

                alert(
                    "Administrator details updated successfully."
                );

                closeAdministratorModal();

                loadAdministrators();

            } catch (error) {

                console.error(
                    "Edit administrator error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}


// ========================================
// UPDATE ADMINISTRATOR STATUS
// ========================================

function updateAdministratorStatus(
    administrator,
    active
) {

    administratorModalTitle.textContent =
        active
            ? "Enable Administrator"
            : "Disable Administrator";


    administratorModalDescription.textContent =
        active
            ? `Enable ${administrator.name}'s account.`
            : `Disable ${administrator.name}'s account.`;


    administratorModalBody.innerHTML = `
        <div class="admin-modal-form">

            <div class="admin-modal-note">

                <strong>
                    Administrator
                </strong>

                <br>

                ${administrator.name}

                <br>

                ${administrator.email}

            </div>


            <div class="admin-modal-note">

                <strong>
                    Current Status:
                </strong>

                ${administrator.active
            ? " Active"
            : " Disabled"
        }

                <br>

                <strong>
                    New Status:
                </strong>

                ${active
            ? " Active"
            : " Disabled"
        }

            </div>


            <div class="admin-modal-note">

                ${active
            ? `
                        Enabling this account will allow
                        the administrator to log in and
                        perform normal administrator tasks.
                    `
            : `
                        Disabling this account will prevent
                        the administrator from logging in.

                        <br><br>

                        Any existing administrator sessions
                        will also be ended.
                    `
        }

            </div>


            <div class="admin-modal-actions">

                <button
                    type="button"
                    class="${active
            ? "admin-modal-button-success"
            : "admin-modal-button-warning"
        }"
                    id="confirm-administrator-status"
                >
                    ${active
            ? "Enable Account"
            : "Disable Account"
        }
                </button>


                <button
                    type="button"
                    class="admin-modal-button-secondary"
                    id="cancel-administrator-status"
                >
                    Cancel
                </button>

            </div>

        </div>
    `;


    administratorModal.hidden = false;


    // ========================================
    // CANCEL
    // ========================================

    const cancelButton =
        document.querySelector(
            "#cancel-administrator-status"
        );

    cancelButton.addEventListener(
        "click",
        function () {

            showAdministratorControls(
                administrator
            );

        }
    );


    // ========================================
    // CONFIRM STATUS CHANGE
    // ========================================

    const confirmButton =
        document.querySelector(
            "#confirm-administrator-status"
        );

    confirmButton.addEventListener(
        "click",
        async function () {

            try {

                const response =
                    await fetch(
                        `/api/admin/administrators/${administrator.id}/status`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-admin-session-token":
                                    administratorSessionToken
                            },

                            body: JSON.stringify({
                                active: active
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to update administrator status."
                    );

                    return;
                }


                alert(
                    data.message
                );


                closeAdministratorModal();

                loadAdministrators();


            } catch (error) {

                console.error(
                    "Administrator status update error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}

// ========================================
// TRANSFER SUPER ADMIN ROLE
// ========================================

function transferSuperAdmin(
    administrator
) {

    administratorModalTitle.textContent =
        "Transfer Super Admin";

    administratorModalDescription.textContent =
        "Transfer Super Admin ownership to another Administrator.";

    administratorModalBody.innerHTML = `
        <div class="admin-modal-form">

            <p class="admin-modal-note">
                You are about to transfer Super Admin ownership.
                This action will change the administrator roles
                immediately.
            </p>

            <div class="admin-modal-note">

                <strong>Current Super Admin</strong>

                <br>

                ${administratorCurrentAdmin.name}

                <br>

                ${administratorCurrentAdmin.email}

            </div>

            <div class="admin-modal-note">

                <strong>New Super Admin</strong>

                <br>

                ${administrator.name}

                <br>

                ${administrator.email}

            </div>

            <div class="admin-modal-note">

                <strong>Important:</strong>

                <br>

                Your current Super Admin session will end
                after the transfer.

                <br><br>

                You will become a normal Administrator and
                must log in again.

            </div>

            <div class="admin-modal-actions">

                <button
                    type="button"
                    class="admin-modal-button-warning"
                    id="confirm-transfer-superadmin"
                >
                    Confirm Transfer
                </button>

                <button
                    type="button"
                    class="admin-modal-button-secondary"
                    id="cancel-transfer-superadmin"
                >
                    Cancel
                </button>

            </div>

        </div>
    `;

    administratorModal.hidden = false;


    // ========================================
    // CANCEL
    // ========================================

    const cancelButton =
        document.querySelector(
            "#cancel-transfer-superadmin"
        );

    cancelButton.addEventListener(
        "click",
        function () {

            showAdministratorControls(
                administrator
            );

        }
    );


    // ========================================
    // CONFIRM TRANSFER
    // ========================================

    const confirmButton =
        document.querySelector(
            "#confirm-transfer-superadmin"
        );

    confirmButton.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    `Transfer Super Admin ownership to ` +
                    `${administrator.name}?\n\n` +

                    `You will become a normal Administrator ` +
                    `and your current Super Admin session ` +
                    `will end.\n\n` +

                    "This action cannot be undone automatically."
                );


            if (!confirmed) {
                return;
            }


            // ========================================
            // SEND TRANSFER REQUEST
            // ========================================

            try {

                const response =
                    await fetch(
                        `/api/admin/administrators/${administrator.id}/transfer-superadmin`,
                        {
                            method: "PATCH",

                            headers: {
                                "x-admin-session-token":
                                    administratorSessionToken
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Super Admin transfer failed."
                    );

                    return;
                }


                alert(
                    "Super Admin ownership transferred successfully.\n\n" +
                    `${administrator.name} is now the Super Admin.\n\n` +
                    "Your current session will now end. " +
                    "Please log in again."
                );


                // ========================================
                // END CURRENT SESSION
                // ========================================

                sessionStorage.removeItem(
                    "admin"
                );

                sessionStorage.removeItem(
                    "adminSessionToken"
                );


                window.location.href =
                    "/admin/login.html";


            } catch (error) {

                console.error(
                    "Super Admin transfer error:",
                    error
                );

                alert(
                    "Unable to complete the Super Admin transfer."
                );
            }
        }
    );
}

// ========================================
// PASSWORD VISIBILITY
// ========================================

function setupPasswordVisibility(
    container
) {

    const toggleButtons =
        container.querySelectorAll(
            ".password-toggle"
        );

    toggleButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const targetId =
                    button.dataset.target;

                const passwordInput =
                    document.getElementById(
                        targetId
                    );

                if (!passwordInput) {
                    return;
                }

                if (
                    passwordInput.type ===
                    "password"
                ) {

                    passwordInput.type =
                        "text";

                    button.textContent =
                        "🙈";

                    button.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    passwordInput.type =
                        "password";

                    button.textContent =
                        "👁️";

                    button.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }
            }
        );
    });
}

// ========================================
// ADD ADMINISTRATOR
// ========================================

function addAdministrator() {

    administratorModalTitle.textContent =
        "Add Administrator";

    administratorModalDescription.textContent =
        "Create a new active Administrator account.";

    administratorModalBody.innerHTML = `
        <form
            class="admin-modal-form"
            id="add-administrator-form"
        >

            <p class="admin-modal-note">
                The new account will be created as an active
                normal Administrator. It will not have
                Super Admin privileges.
            </p>

            <label>
                Full Name

                <input
                    type="text"
                    id="add-administrator-name"
                    placeholder="Enter full name"
                    required
                >
            </label>

            <label>
                Email

                <input
                    type="email"
                    id="add-administrator-email"
                    placeholder="Enter email address"
                    required
                >
            </label>

            <label>
                Password

                <div class="password-input-wrapper">

                    <input
                        type="password"
                        id="add-administrator-password"
                        minlength="8"
                        placeholder="Minimum 8 characters"
                        required
                    >

                    <button
                        type="button"
                        class="password-toggle"
                        data-target="add-administrator-password"
                        aria-label="Show password"
                    >
                        👁️
                    </button>

                </div>
            </label>

            <label>
                Confirm Password

                <div class="password-input-wrapper">

                    <input
                        type="password"
                        id="add-administrator-confirm-password"
                        minlength="8"
                        placeholder="Re-enter password"
                        required
                    >

                    <button
                        type="button"
                        class="password-toggle"
                        data-target="add-administrator-confirm-password"
                        aria-label="Show password"
                    >
                        👁️
                    </button>

                </div>
            </label>

            <div class="admin-modal-actions">

                <button
                    type="submit"
                    class="admin-modal-button-primary"
                >
                    Create Administrator
                </button>

                <button
                    type="button"
                    class="admin-modal-button-secondary"
                    id="cancel-add-administrator"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    administratorModal.hidden = false;
    setupPasswordVisibility(
        administratorModalBody
    );


    // ========================================
    // FORM REFERENCES
    // ========================================

    const form =
        document.querySelector(
            "#add-administrator-form"
        );

    const cancelButton =
        document.querySelector(
            "#cancel-add-administrator"
        );


    // ========================================
    // CANCEL
    // ========================================

    cancelButton.addEventListener(
        "click",
        function () {

            closeAdministratorModal();

        }
    );


    // ========================================
    // SUBMIT
    // ========================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .querySelector(
                        "#add-administrator-name"
                    )
                    .value
                    .trim();

            const email =
                document
                    .querySelector(
                        "#add-administrator-email"
                    )
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .querySelector(
                        "#add-administrator-password"
                    )
                    .value;

            const confirmPassword =
                document
                    .querySelector(
                        "#add-administrator-confirm-password"
                    )
                    .value;


            // ========================================
            // VALIDATION
            // ========================================

            if (!name) {

                alert(
                    "Administrator name is required."
                );

                return;
            }


            if (!email) {

                alert(
                    "Administrator email is required."
                );

                return;
            }


            if (password.length < 8) {

                alert(
                    "Password must be at least 8 characters long."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "The passwords do not match."
                );

                return;
            }


            // ========================================
            // CONFIRM CREATION
            // ========================================

            const confirmed =
                confirm(
                    "Create this administrator?\n\n" +
                    `Name: ${name}\n` +
                    `Email: ${email}\n\n` +
                    "The account will be created as an active normal Admin."
                );


            if (!confirmed) {
                return;
            }


            // ========================================
            // CREATE ADMINISTRATOR
            // ========================================

            try {

                const response =
                    await fetch(
                        "/api/admin/administrators",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-admin-session-token":
                                    administratorSessionToken
                            },

                            body: JSON.stringify({
                                name:
                                    name,

                                email:
                                    email,

                                password:
                                    password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to create administrator."
                    );

                    return;
                }


                alert(
                    "Administrator created successfully.\n\n" +
                    `${data.admin.name} has been added as an active Admin.`
                );


                closeAdministratorModal();

                loadAdministrators();


            } catch (error) {

                console.error(
                    "Add administrator error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}

// ========================================
// REMOVE ADMINISTRATOR
// ========================================

function removeAdministrator(
    administrator
) {

    administratorModalTitle.textContent =
        "Remove Administrator";


    administratorModalDescription.textContent =
        `Permanently remove ${administrator.name}'s administrator account.`;


    administratorModalBody.innerHTML = `
        <div class="admin-modal-form">

            <div class="admin-modal-note">

                <strong>
                    Administrator
                </strong>

                <br>

                ${administrator.name}

                <br>

                ${administrator.email}

            </div>


            <div class="admin-modal-note">

                <strong>
                    Current Status:
                </strong>

                Disabled

                <br>

                <strong>
                    Role:
                </strong>

                Administrator

            </div>


            <div class="admin-modal-note">

                <strong>
                    Important:
                </strong>

                <br><br>

                This administrator account is currently
                disabled and will be permanently removed.

                <br><br>

                The administrator will no longer appear
                in the Administrator Management list.

                <br><br>

                This action cannot be undone automatically.

            </div>


            <div class="admin-modal-actions">

                <button
                    type="button"
                    class="admin-modal-button-danger"
                    id="confirm-remove-administrator"
                >
                    Remove Administrator
                </button>


                <button
                    type="button"
                    class="admin-modal-button-secondary"
                    id="cancel-remove-administrator"
                >
                    Cancel
                </button>

            </div>

        </div>
    `;


    administratorModal.hidden = false;


    // ========================================
    // CANCEL
    // ========================================

    const cancelButton =
        document.querySelector(
            "#cancel-remove-administrator"
        );


    cancelButton.addEventListener(
        "click",
        function () {

            showAdministratorControls(
                administrator
            );

        }
    );


    // ========================================
    // CONFIRM REMOVAL
    // ========================================

    const confirmButton =
        document.querySelector(
            "#confirm-remove-administrator"
        );


    confirmButton.addEventListener(
        "click",
        async function () {

            try {

                const response =
                    await fetch(
                        `/api/admin/administrators/${administrator.id}`,
                        {
                            method: "DELETE",

                            headers: {
                                "x-admin-session-token":
                                    administratorSessionToken
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to remove administrator."
                    );

                    return;
                }


                alert(
                    data.message
                );


                closeAdministratorModal();

                loadAdministrators();

            } catch (error) {

                console.error(
                    "Remove administrator error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}


// ===================================
// RESET ADMINISTRATOR PASSWORD
// SUPER ADMIN ONLY
// ===================================

function resetAdministratorPassword(
    administrator
) {

    administratorModalTitle.textContent =
        "Reset Administrator Password";

    administratorModalDescription.textContent =
        `Set a new password for ${administrator.name}.`;

    administratorModalBody.innerHTML = `
        <form
            class="admin-modal-form"
            id="reset-administrator-password-form"
        >

            <p class="admin-modal-note">
                The new password must contain at least
                8 characters.
            </p>

            <label>
                New Password

                <div class="password-input-wrapper">

                    <input
                        type="password"
                        id="new-administrator-password"
                        minlength="8"
                        placeholder="Minimum 8 characters"
                        required
                    >

                    <button
                        type="button"
                        class="password-toggle"
                        data-target="new-administrator-password"
                        aria-label="Show password"
                    >
                        👁️
                    </button>

                </div>
            </label>

            <label>
                Confirm New Password

                <div class="password-input-wrapper">

                    <input
                        type="password"
                        id="confirm-administrator-password"
                        minlength="8"
                        placeholder="Re-enter password"
                        required
                    >

                    <button
                        type="button"
                        class="password-toggle"
                        data-target="confirm-administrator-password"
                        aria-label="Show password"
                    >
                        👁️
                    </button>

                </div>
            </label>

            <div class="admin-modal-actions">

                <button
                    type="submit"
                    class="admin-modal-button-primary"
                >
                    Reset Password
                </button>

                <button
                    type="button"
                    class="admin-modal-button-secondary"
                    id="cancel-reset-administrator-password"
                >
                    Cancel
                </button>

            </div>

        </form>
    `;

    administratorModal.hidden = false;
    setupPasswordVisibility(
        administratorModalBody
    );

    const form =
        document.querySelector(
            "#reset-administrator-password-form"
        );

    const cancelButton =
        document.querySelector(
            "#cancel-reset-administrator-password"
        );

    cancelButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            administratorModalTitle.textContent =
                `Manage ${administrator.name}`;

            administratorModalDescription.textContent =
                `${administrator.email} • ${administrator.role === "superadmin"
                    ? "Super Admin"
                    : "Administrator"
                }`;

            showAdministratorControls(
                administrator
            );
        }
    );

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const password =
                document
                    .querySelector(
                        "#new-administrator-password"
                    )
                    .value;

            const confirmPassword =
                document
                    .querySelector(
                        "#confirm-administrator-password"
                    )
                    .value;

            if (password.length < 8) {

                alert(
                    "Password must be at least 8 characters long."
                );

                return;
            }

            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "The passwords do not match."
                );

                return;
            }

            const confirmed =
                confirm(
                    `Reset the password for ${administrator.name}?`
                );

            if (!confirmed) {
                return;
            }

            try {

                const response =
                    await fetch(
                        `/api/admin/administrators/${administrator.id}/password`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-admin-session-token":
                                    administratorSessionToken
                            },

                            body: JSON.stringify({
                                password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to reset administrator password."
                    );

                    return;
                }

                alert(
                    "Administrator password reset successfully."
                );

                closeAdministratorModal();

                loadAdministrators();

            } catch (error) {

                console.error(
                    "Reset administrator password error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }
        }
    );
}

// ========================================
// ADMINISTRATOR MODAL
// ========================================

function closeAdministratorModal() {

    administratorModal.hidden = true;

    administratorModalBody.innerHTML = "";
}

administratorModalClose.addEventListener(
    "click",
    closeAdministratorModal
);

administratorModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            administratorModal
        ) {
            closeAdministratorModal();
        }
    }
);
