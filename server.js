const express = require("express");
const crypto = require("crypto");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const app = express();

// ===========================================
// PARSE JSON REQUEST BODIES
// ===========================================

app.use(express.json());

// ========================================
// ADMIN SESSIONS
// ========================================

const adminSessions = new Map();

function createAdminSession(admin) {

    const token =
        crypto.randomBytes(32).toString("hex");

    adminSessions.set(
        token,
        {
            adminId: admin.id,
            createdAt: Date.now()
        }
    );

    return token;
}

// ========================================
// CUSTOMER SESSIONS
// ========================================

const customerSessions = new Map();

// ========================================
// CUSTOMER PASSWORD RESET TOKENS
// ========================================

const passwordResetTokens = new Map();

function createCustomerSession(customer) {

    const token =
        crypto.randomBytes(32).toString("hex");

    customerSessions.set(
        token,
        {
            customerId: customer.id,
            createdAt: Date.now()
        }
    );

    return token;
}

// ========================================
// ADMIN PASSWORD RESET TOKENS
// ========================================

const adminPasswordResetTokens = new Map();

// ========================================
// REQUIRE VALID ADMIN SESSION
// ========================================

function requireAdminSession(req, res, next) {

    const sessionToken =
        req.headers["x-admin-session-token"];

    if (!sessionToken) {

        return res.status(401).json({
            message: "Admin session is required."
        });

    }

    const session =
        adminSessions.get(sessionToken);

    if (!session) {

        return res.status(401).json({
            message: "Admin session is invalid or expired."
        });

    }

    // ========================================
    // FIND ACTIVE ADMINISTRATOR
    // ========================================

    const admin =
        admins.find(function (item) {

            return (
                Number(item.id) ===
                Number(session.adminId) &&

                (
                    item.role === "admin" ||
                    item.role === "superadmin"
                ) &&

                item.active === true
            );

        });

    if (!admin) {

        adminSessions.delete(sessionToken);

        return res.status(401).json({
            message: "Administrator account no longer exists."
        });

    }

    req.admin = admin;

    next();
}

// ========================================
// REQUIRE SUPER ADMIN SESSION
// ========================================

function requireSuperAdmin(req, res, next) {

    // First verify that the administrator
    // has a valid active admin session.
    requireAdminSession(req, res, function () {

        // Only Super Admin can continue.
        if (req.admin.role !== "superadmin") {

            return res.status(403).json({
                message:
                    "Super Admin access is required."
            });

        }

        // Super Admin verified.
        next();
    });
}

// ========================================
// GET ALL ADMINISTRATORS
// SUPER ADMIN ONLY
// ========================================

app.get(
    "/api/admin/administrators",
    requireSuperAdmin,
    (req, res) => {

        const administratorList =
            admins.map(function (admin) {

                return {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    active: admin.active
                };

            });

        res.json(administratorList);
    }
);

// ========================================
// ENABLE / DISABLE ADMINISTRATOR
// SUPER ADMIN ONLY
// ========================================

app.patch(
    "/api/admin/administrators/:id/status",
    requireSuperAdmin,
    (req, res) => {

        const administratorId =
            Number(req.params.id);

        const { active } = req.body;

        // ========================================
        // VALIDATE REQUEST
        // ========================================

        if (typeof active !== "boolean") {

            return res.status(400).json({
                message:
                    "Active status must be true or false."
            });

        }


        // ========================================
        // FIND ADMINISTRATOR
        // ========================================

        const administrator =
            admins.find(function (admin) {

                return Number(admin.id) ===
                    administratorId;

            });


        if (!administrator) {

            return res.status(404).json({
                message:
                    "Administrator not found."
            });

        }


        // ========================================
        // PROTECT SUPER ADMIN
        // ========================================

        if (
            Number(administrator.id) ===
            Number(req.admin.id)
        ) {

            return res.status(400).json({
                message:
                    "You cannot disable or modify your own account status."
            });

        }


        // ========================================
        // PREVENT DISABLING LAST ACTIVE
        // SUPER ADMIN
        // ========================================

        if (
            administrator.role === "superadmin" &&
            active === false
        ) {

            const activeSuperAdmins =
                admins.filter(function (admin) {

                    return (
                        admin.role === "superadmin" &&
                        admin.active === true
                    );

                });

            if (activeSuperAdmins.length <= 1) {

                return res.status(400).json({
                    message:
                        "The last active Super Admin cannot be disabled."
                });

            }

        }


        // ========================================
        // SAVE OLD STATUS
        // ========================================

        const oldStatus =
            administrator.active;


        // ========================================
        // UPDATE STATUS
        // ========================================

        administrator.active =
            active;

        saveAdmins();


        // ========================================
        // INVALIDATE SESSIONS
        // ========================================

        if (active === false) {

            for (
                const [
                    token,
                    session
                ]
                of adminSessions.entries()
            ) {

                if (
                    Number(session.adminId) ===
                    Number(administrator.id)
                ) {

                    adminSessions.delete(token);

                }

            }

        }


        // ========================================
        // RECORD HISTORY
        // ========================================

        recordHistory({

            admin: req.admin,

            action:
                active
                    ? "Administrator account enabled"
                    : "Administrator account disabled",

            productId: null,

            productName:
                administrator.name,

            oldValue:
                oldStatus
                    ? "Active"
                    : "Disabled",

            newValue:
                active
                    ? "Active"
                    : "Disabled"

        });


        // ========================================
        // RESPONSE
        // ========================================

        res.json({

            message:
                active
                    ? "Administrator enabled successfully."
                    : "Administrator disabled successfully.",

            admin: {

                id: administrator.id,

                name: administrator.name,

                email: administrator.email,

                role: administrator.role,

                active: administrator.active

            }

        });

    }
);

// ========================================
// EDIT ADMINISTRATOR DETAILS
// SUPER ADMIN ONLY
// ========================================

app.patch(
    "/api/admin/administrators/:id",
    requireSuperAdmin,
    (req, res) => {

        const administratorId =
            Number(req.params.id);

        const {
            name,
            email
        } = req.body;


        // ========================================
        // VALIDATE INPUT
        // ========================================

        if (!name || !email) {

            return res.status(400).json({
                message:
                    "Name and email are required."
            });

        }


        const cleanName =
            name.trim();

        const normalizedEmail =
            email.trim().toLowerCase();


        if (!cleanName || !normalizedEmail) {

            return res.status(400).json({
                message:
                    "Name and email cannot be empty."
            });

        }


        // ========================================
        // FIND ADMINISTRATOR
        // ========================================

        const administrator =
            admins.find(function (admin) {

                return Number(admin.id) ===
                    administratorId;

            });


        if (!administrator) {

            return res.status(404).json({
                message:
                    "Administrator not found."
            });

        }


        // ========================================
        // CHECK DUPLICATE EMAIL
        // ========================================

        const duplicateEmail =
            admins.find(function (admin) {

                return (
                    Number(admin.id) !==
                    administratorId &&

                    admin.email.toLowerCase() ===
                    normalizedEmail
                );

            });


        if (duplicateEmail) {

            return res.status(409).json({
                message:
                    "Another administrator already uses this email."
            });

        }


        // ========================================
        // SAVE OLD VALUES
        // ========================================

        const oldName =
            administrator.name;

        const oldEmail =
            administrator.email;


        // ========================================
        // UPDATE DETAILS
        // ========================================

        administrator.name =
            cleanName;

        administrator.email =
            normalizedEmail;


        saveAdmins();


        // ========================================
        // RECORD NAME CHANGE
        // ========================================

        if (oldName !== administrator.name) {

            recordHistory({

                admin: req.admin,

                action:
                    "Administrator name changed",

                productId: null,

                productName:
                    administrator.name,

                oldValue:
                    oldName,

                newValue:
                    administrator.name

            });

        }


        // ========================================
        // RECORD EMAIL CHANGE
        // ========================================

        if (oldEmail !== administrator.email) {

            recordHistory({

                admin: req.admin,

                action:
                    "Administrator email changed",

                productId: null,

                productName:
                    administrator.name,

                oldValue:
                    oldEmail,

                newValue:
                    administrator.email

            });

        }


        // ========================================
        // RESPONSE
        // ========================================

        res.json({

            message:
                "Administrator details updated successfully.",

            admin: {

                id:
                    administrator.id,

                name:
                    administrator.name,

                email:
                    administrator.email,

                role:
                    administrator.role,

                active:
                    administrator.active

            }

        });

    }
);

// ========================================
// RESET ADMINISTRATOR PASSWORD
// SUPER ADMIN ONLY
// ========================================

app.patch(
    "/api/admin/administrators/:id/password",
    requireSuperAdmin,
    (req, res) => {

        const administratorId =
            Number(req.params.id);

        const { password } =
            req.body;


        // ========================================
        // VALIDATE PASSWORD
        // ========================================

        if (!password) {

            return res.status(400).json({
                message:
                    "New password is required."
            });

        }


        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long."
            });

        }


        // ========================================
        // FIND ADMINISTRATOR
        // ========================================

        const administrator =
            admins.find(function (admin) {

                return Number(admin.id) ===
                    administratorId;

            });


        if (!administrator) {

            return res.status(404).json({
                message:
                    "Administrator not found."
            });

        }


        // ========================================
        // PREVENT SELF PASSWORD RESET
        // ========================================

        if (
            Number(administrator.id) ===
            Number(req.admin.id)
        ) {

            return res.status(400).json({
                message:
                    "Use your own password-reset process to change your password."
            });

        }


        // ========================================
        // CREATE NEW PASSWORD HASH
        // ========================================

        const passwordHash =
            createAdminPasswordHash(
                password
            );


        administrator.passwordHash =
            passwordHash;


        // Remove legacy plain-text password
        // if one somehow still exists.
        delete administrator.password;


        saveAdmins();


        // ========================================
        // INVALIDATE EXISTING SESSIONS
        // ========================================

        for (
            const [
                token,
                session
            ]
            of adminSessions.entries()
        ) {

            if (
                Number(session.adminId) ===
                Number(administrator.id)
            ) {

                adminSessions.delete(token);

            }

        }


        // ========================================
        // RECORD HISTORY
        // ========================================

        recordHistory({

            admin: req.admin,

            action:
                "Administrator password reset",

            productId: null,

            productName:
                administrator.name,

            oldValue:
                "Password changed",

            newValue:
                "New password set"

        });


        // ========================================
        // RESPONSE
        // ========================================

        res.json({

            message:
                "Administrator password reset successfully.",

            admin: {

                id:
                    administrator.id,

                name:
                    administrator.name,

                email:
                    administrator.email,

                role:
                    administrator.role,

                active:
                    administrator.active

            }

        });

    }
);

// =======================================
// DELETE/REMOVE ADMINISTRATOR
// SUPER ADMIN ONLY
// =======================================

app.delete(
    "/api/admin/administrators/:id",
    requireSuperAdmin,
    (req, res) => {

        const administratorId =
            Number(req.params.id);

        const administrator =
            admins.find(function (admin) {
                return Number(admin.id) ===
                    administratorId;
            });

        if (!administrator) {

            return res.status(404).json({
                message:
                    "Administrator not found."
            });
        }


        // A Super Admin cannot remove
        // their own account.
        if (
            Number(administrator.id) ===
            Number(req.admin.id)
        ) {

            return res.status(400).json({
                message:
                    "You cannot remove your own administrator account."
            });
        }


        // Another Super Admin cannot be removed.
        if (
            administrator.role ===
            "superadmin"
        ) {

            return res.status(400).json({
                message:
                    "A Super Admin cannot be removed. Transfer ownership first."
            });
        }


        // Only disabled administrators
        // can be permanently removed.
        if (
            administrator.active === true
        ) {

            return res.status(400).json({
                message:
                    "An active administrator must be disabled before it can be removed."
            });
        }


        const removedAdministrator = {
            id: administrator.id,
            name: administrator.name,
            email: administrator.email,
            role: administrator.role,
            active: administrator.active
        };


        // Remove the administrator from
        // the active administrator list.
        const administratorIndex =
            admins.findIndex(function (admin) {
                return Number(admin.id) ===
                    administratorId;
            });

        admins.splice(
            administratorIndex,
            1
        );

        saveAdmins();


        // Invalidate all existing sessions
        // belonging to the removed administrator.
        for (
            const [
                token,
                session
            ]
            of adminSessions.entries()
        ) {

            if (
                Number(session.adminId) ===
                administratorId
            ) {

                adminSessions.delete(token);
            }
        }


        // Record the removal in history.
        recordHistory({
            admin: req.admin,
            action:
                "Administrator account removed",
            productId: null,
            productName:
                removedAdministrator.name,
            oldValue:
                "Disabled",
            newValue:
                "Removed"
        });


        res.json({
            message:
                "Administrator removed successfully.",

            admin:
                removedAdministrator
        });
    }
);

// ========================================
// TRANSFER SUPER ADMIN OWNERSHIP
// SUPER ADMIN ONLY
// ========================================

app.patch(
    "/api/admin/administrators/:id/transfer-superadmin",
    requireSuperAdmin,
    (req, res) => {

        const targetAdministratorId =
            Number(req.params.id);

        const targetAdministrator =
            admins.find(function (admin) {
                return Number(admin.id) ===
                    targetAdministratorId;
            });

        if (!targetAdministrator) {
            return res.status(404).json({
                message:
                    "Target administrator not found."
            });
        }

        if (
            Number(targetAdministrator.id) ===
            Number(req.admin.id)
        ) {
            return res.status(400).json({
                message:
                    "You are already the Super Admin."
            });
        }

        if (targetAdministrator.active !== true) {
            return res.status(400).json({
                message:
                    "Super Admin ownership can only be transferred to an active administrator."
            });
        }

        if (
            targetAdministrator.role !== "admin"
        ) {
            return res.status(400).json({
                message:
                    "The selected administrator cannot receive Super Admin ownership."
            });
        }

        const currentSuperAdmin =
            admins.find(function (admin) {
                return (
                    Number(admin.id) ===
                    Number(req.admin.id) &&

                    admin.role === "superadmin" &&

                    admin.active === true
                );
            });

        if (!currentSuperAdmin) {
            return res.status(400).json({
                message:
                    "Current Super Admin account could not be verified."
            });
        }

        // Keep the current Super Admin's identity
        // for the history records before changing the role.
        const actingAdminForHistory = {
            id: currentSuperAdmin.id,
            name: currentSuperAdmin.name,
            email: currentSuperAdmin.email
        };

        const previousOwnerName =
            currentSuperAdmin.name;

        const newOwnerName =
            targetAdministrator.name;

        // Change both administrator roles.
        currentSuperAdmin.role =
            "admin";

        targetAdministrator.role =
            "superadmin";

        saveAdmins();

        // Record the old Super Admin's role change.
        recordHistory({
            admin: actingAdminForHistory,
            action:
                "Administrator role transferred",
            productId: null,
            productName:
                previousOwnerName,
            oldValue:
                "superadmin",
            newValue:
                "admin"
        });

        // Record the new Super Admin's role change.
        recordHistory({
            admin: actingAdminForHistory,
            action:
                "Administrator role transferred",
            productId: null,
            productName:
                newOwnerName,
            oldValue:
                "admin",
            newValue:
                "superadmin"
        });

        // Invalidate the old Super Admin's sessions.
        for (
            const [
                token,
                session
            ]
            of adminSessions.entries()
        ) {
            if (
                Number(session.adminId) ===
                Number(currentSuperAdmin.id)
            ) {
                adminSessions.delete(token);
            }
        }

        res.json({
            message:
                "Super Admin ownership transferred successfully.",

            previousSuperAdmin: {
                id:
                    currentSuperAdmin.id,
                name:
                    currentSuperAdmin.name,
                role:
                    currentSuperAdmin.role
            },

            newSuperAdmin: {
                id:
                    targetAdministrator.id,
                name:
                    targetAdministrator.name,
                role:
                    targetAdministrator.role
            }
        });
    }
);

// ========================================
// ADD ADMINISTRATOR
// SUPER ADMIN ONLY
// ========================================

app.post(
    "/api/admin/administrators",
    requireSuperAdmin,
    (req, res) => {

        const {
            name,
            email,
            password
        } = req.body;

        // ========================================
        // VALIDATE REQUIRED FIELDS
        // ========================================

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required."
            });

        }

        const cleanName =
            name.trim();

        const normalizedEmail =
            email.trim().toLowerCase();

        // ========================================
        // VALIDATE PASSWORD
        // ========================================

        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long."
            });

        }

        // ========================================
        // CHECK DUPLICATE EMAIL
        // ========================================

        const existingAdmin =
            admins.find(function (admin) {

                return (
                    admin.email.toLowerCase() ===
                    normalizedEmail
                );

            });

        if (existingAdmin) {

            return res.status(409).json({
                message:
                    "An administrator with this email already exists."
            });

        }

        // ========================================
        // CREATE NEW ADMIN ID
        // ========================================

        const newId =
            admins.length > 0
                ? Math.max(
                    ...admins.map(function (admin) {
                        return Number(admin.id);
                    })
                ) + 1
                : 1;

        // ========================================
        // HASH PASSWORD
        // ========================================

        const passwordHash =
            createAdminPasswordHash(
                password
            );

        // ========================================
        // CREATE ADMINISTRATOR
        // ========================================

        const newAdmin = {

            id: newId,

            name: cleanName,

            email: normalizedEmail,

            role: "admin",

            passwordHash: passwordHash,

            active: true

        };

        // ========================================
        // SAVE ADMINISTRATOR
        // ========================================

        admins.push(newAdmin);

        saveAdmins();

        // ========================================
        // RECORD HISTORY
        // ========================================

        recordHistory({

            admin: req.admin,

            action:
                "Administrator account created",

            productId: null,

            productName:
                newAdmin.name,

            oldValue: null,

            newValue:
                `Administrator created: ${newAdmin.name} (${newAdmin.email})`

        });

        // ========================================
        // RETURN SAFE ADMIN DATA
        // ========================================

        res.status(201).json({

            message:
                "Administrator created successfully.",

            admin: {

                id: newAdmin.id,

                name: newAdmin.name,

                email: newAdmin.email,

                role: newAdmin.role,

                active: newAdmin.active

            }

        });

    }
);

// ========================================
// REQUIRE VALID CUSTOMER SESSION
// ========================================

function requireCustomerSession(req, res, next) {

    const sessionToken =
        req.headers["x-customer-session-token"];

    if (!sessionToken) {
        return res.status(401).json({
            message: "Customer session is required."
        });
    }

    const session =
        customerSessions.get(sessionToken);

    if (!session) {
        return res.status(401).json({
            message: "Customer session is invalid or expired."
        });
    }

    const customer =
        customers.find(function (item) {

            return (
                Number(item.id) ===
                Number(session.customerId)
            );

        });

    if (!customer) {

        customerSessions.delete(
            sessionToken
        );

        return res.status(401).json({
            message: "Customer account no longer exists."
        });

    }

    req.customer = customer;

    next();
}

// ========================================
// PRODUCT DATA
// ========================================

const dataDir =
    process.env.DATA_DIR || path.join(__dirname, "data");

const productsFile = path.join(dataDir, "products.json");
const categoriesFile = path.join(dataDir, "categories.json");
const unitsFile = path.join(dataDir, "units.json");
const adminsFile = path.join(dataDir, "admins.json");
const historyFile = path.join(dataDir, "history.json");
const customersFile = path.join(dataDir, "customers.json");

const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
const categories = JSON.parse(fs.readFileSync(categoriesFile, "utf8"));
const units = JSON.parse(fs.readFileSync(unitsFile, "utf8"));
const admins = JSON.parse(fs.readFileSync(adminsFile, "utf8"));
const customers = JSON.parse(fs.readFileSync(customersFile, "utf8"));
const history = JSON.parse(fs.readFileSync(historyFile, "utf8"));

// ========================================
// SAVE PRODUCTS
// ========================================

function saveProducts() {

    fs.writeFileSync(
        productsFile,
        JSON.stringify(products, null, 4),
        "utf8"
    );

}

function saveCategories() {

    fs.writeFileSync(
        categoriesFile,
        JSON.stringify(categories, null, 4),
        "utf8"
    );

}

function saveUnits() {
    fs.writeFileSync(
        unitsFile,
        JSON.stringify(units, null, 4),
        "utf8"
    );
}

function saveHistory() {
    fs.writeFileSync(
        historyFile,
        JSON.stringify(history, null, 4),
        "utf8"
    );
}

function saveCustomers() {
    fs.writeFileSync(
        customersFile,
        JSON.stringify(customers, null, 4),
        "utf8"
    );
}

function saveAdmins() {

    fs.writeFileSync(
        adminsFile,
        JSON.stringify(
            admins,
            null,
            4
        ),
        "utf8"
    );
}

// ========================================
// ADMIN PASSWORD HASHING
// ========================================

function createAdminPasswordHash(password) {

    return crypto
        .scryptSync(
            password,
            "baban-yasir-admin-salt",
            64
        )
        .toString("hex");
}

// ========================================
// BREVO PASSWORD RESET EMAIL
// ========================================

async function sendPasswordResetEmail(
    recipientEmail,
    resetLink
) {

    const response =
        await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "api-key":
                        process.env.BREVO_API_KEY,
                    "content-type":
                        "application/json"
                },

                body: JSON.stringify({

                    sender: {
                        name:
                            "BABAN YASIR ENTERPRISE",
                        email:
                            process.env
                                .BREVO_SENDER_EMAIL
                    },

                    to: [
                        {
                            email:
                                recipientEmail
                        }
                    ],

                    subject:
                        "BABAN YASIR ENTERPRISE - Password Reset",

                    htmlContent: `
                        <h2>Password Reset</h2>

                        <p>
                            You requested to reset your
                            BABAN YASIR ENTERPRISE account
                            password.
                        </p>

                        <p>
                            Click the button below to
                            create a new password:
                        </p>

                        <p>
                            <a
                                href="${resetLink}"
                                style="
                                    display:inline-block;
                                    padding:10px 16px;
                                    background:#222;
                                    color:#fff;
                                    text-decoration:none;
                                    border-radius:5px;
                                "
                            >
                                Reset Password
                            </a>
                        </p>

                        <p>
                            This link will expire in
                            15 minutes.
                        </p>

                        <p>
                            If you did not request this,
                            you can safely ignore this email.
                        </p>
                    `
                })
            }
        );

    if (!response.ok) {

        const errorData =
            await response.text();

        throw new Error(
            `Brevo email failed: ${errorData}`
        );
    }

    return true;
}

// ========================================
// BREVO CUSTOMER WELCOME EMAIL
// ========================================

async function sendCustomerWelcomeEmail(
    recipientEmail,
    customerName
) {

    const response =
        await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "api-key":
                        process.env.BREVO_API_KEY,
                    "content-type":
                        "application/json"
                },

                body: JSON.stringify({

                    sender: {
                        name:
                            "BABAN YASIR ENTERPRISE",
                        email:
                            process.env
                                .BREVO_SENDER_EMAIL
                    },

                    to: [
                        {
                            email:
                                recipientEmail
                        }
                    ],

                    subject:
                        "Welcome to BABAN YASIR ENTERPRISE",

                    htmlContent: `
                        <h2>
                            Welcome to BABAN YASIR ENTERPRISE!
                        </h2>

                        <p>
                            Dear ${customerName},
                        </p>

                        <p>
                            Thank you for registering with
                            <strong>
                                BABAN YASIR ENTERPRISE
                            </strong>.
                        </p>

                        <p>
                            Your customer account has been
                            successfully created.
                        </p>

                        <p>
                            You can now log in to your account
                            and view our available
                            building materials and latest prices.
                        </p>

                        <p>
                            We appreciate your interest in
                            our business and look forward to
                            serving you.
                        </p>

                        <p>
                            <strong>
                                Thank you for choosing
                                BABAN YASIR ENTERPRISE.
                            </strong>
                        </p>

                        <br>

                        <p>
                            Best regards,<br>
                            BABAN YASIR ENTERPRISE
                        </p>
                    `
                })
            }
        );

    if (!response.ok) {

        const errorData =
            await response.text();

        throw new Error(
            `Brevo welcome email failed: ${errorData}`
        );
    }

    return true;
}

// ========================================
// BREVO ADMIN PASSWORD RESET EMAIL
// ========================================

async function sendAdminPasswordResetEmail(
    recipientEmail,
    resetLink
) {

    const response =
        await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "api-key":
                        process.env.BREVO_API_KEY,
                    "content-type":
                        "application/json"
                },

                body: JSON.stringify({

                    sender: {
                        name:
                            "BABAN YASIR ENTERPRISE",
                        email:
                            process.env
                                .BREVO_SENDER_EMAIL
                    },

                    to: [
                        {
                            email:
                                recipientEmail
                        }
                    ],

                    subject:
                        "BABAN YASIR ENTERPRISE - Admin Password Reset",

                    htmlContent: `
                        <h2>Administrator Password Reset</h2>

                        <p>
                            A password reset was requested
                            for your BABAN YASIR ENTERPRISE
                            administrator account.
                        </p>

                        <p>
                            Click the button below to
                            create a new administrator password:
                        </p>

                        <p>
                            <a
                                href="${resetLink}"
                                style="
                                    display:inline-block;
                                    padding:10px 16px;
                                    background:#222;
                                    color:#fff;
                                    text-decoration:none;
                                    border-radius:5px;
                                "
                            >
                                Reset Admin Password
                            </a>
                        </p>

                        <p>
                            This link will expire in
                            15 minutes.
                        </p>

                        <p>
                            If you did not request this,
                            you can safely ignore this email.
                        </p>
                    `
                })
            }
        );

    if (!response.ok) {

        const errorData =
            await response.text();

        throw new Error(
            `Brevo admin email failed: ${errorData}`
        );
    }

    return true;
}

// ========================================
// DATA NORMALIZATION HELPERS
// ========================================

// Convert multiple spaces into one and remove
// unnecessary spaces around the text.
function cleanText(value) {

    if (typeof value !== "string") {
        return value;
    }

    return value
        .trim()
        .replace(/\s+/g, " ");
}


// Convert text to Title Case.
//
// Example:
// "per piece"      → "Per Piece"
// "PER ROLL"       → "Per Roll"
// "bathroom tap"   → "Bathroom Tap"
//
// Words containing numbers or symbols are preserved
// while their letters are normalized.
function normalizeText(value) {

    const cleaned =
        cleanText(value);

    if (!cleaned) {
        return cleaned;
    }

    return cleaned
        .toLowerCase()
        .replace(
            /\b([a-z])/g,
            function (match) {
                return match.toUpperCase();
            }
        );
}


// Normalize a category.
function normalizeCategory(value) {

    return normalizeText(value);
}


// Normalize a unit.
function normalizeUnit(value) {

    return normalizeText(value);
}


// ========================================
// NORMALIZE PRODUCT NAME
// ========================================

// Convert normal product names to Title Case
// while preserving common technical abbreviations.
function normalizeProductName(value) {

    const cleaned =
        cleanText(value);

    if (!cleaned) {
        return cleaned;
    }

    // First convert the product name to Title Case.
    let normalized =
        cleaned
            .toLowerCase()
            .replace(
                /\b([a-z])/g,
                function (match) {
                    return match.toUpperCase();
                }
            );

    // Restore common technical abbreviations.
    const abbreviations = [
        "PVC",
        "UPVC",
        "CPVC",
        "PPR",
        "HDPE",
        "MDPE",
        "PEX",
        "ABS",
        "LED",
        "USB",
        "HDMI",
        "MCB",
        "RCCB",
        "RCBO",
        "ELCB",
        "AC",
        "DC",
        "GI",
        "MS",
        "SS"
    ];

    abbreviations.forEach(
        function (abbreviation) {

            const pattern =
                new RegExp(
                    "\\b" +
                    abbreviation +
                    "\\b",
                    "gi"
                );

            normalized =
                normalized.replace(
                    pattern,
                    abbreviation
                );

        }
    );

    return normalized;
}


// Add a category to categories.json if it does not
// already exist.
//
// Returns the normalized category name.
function ensureCategory(category) {

    const normalizedCategory =
        normalizeCategory(category);

    if (!normalizedCategory) {
        return normalizedCategory;
    }

    const existingCategory =
        categories.find(
            function (existing) {
                return (
                    normalizeCategory(existing) ===
                    normalizedCategory
                );
            }
        );

    if (existingCategory) {
        return existingCategory;
    }

    categories.push(
        normalizedCategory
    );

    saveCategories();

    return normalizedCategory;
}


// Add a unit to units.json if it does not
// already exist.
//
// Returns the normalized unit name.
function ensureUnit(unit) {

    const normalizedUnit =
        normalizeUnit(unit);

    if (!normalizedUnit) {
        return normalizedUnit;
    }

    const existingUnit =
        units.find(
            function (existing) {
                return (
                    normalizeUnit(existing) ===
                    normalizedUnit
                );
            }
        );

    if (existingUnit) {
        return existingUnit;
    }

    units.push(
        normalizedUnit
    );

    saveUnits();

    return normalizedUnit;
}

// ========================================
// VERIFY ADMIN
// ========================================

function verifyAdmin(admin) {

    if (!admin || !admin.id || !admin.email) {
        return null;
    }

    const verifiedAdmin = admins.find(
        item =>
            Number(item.id) === Number(admin.id) &&
            item.email.toLowerCase() ===
            admin.email.toLowerCase() &&

            (
                item.role === "admin" ||
                item.role === "superadmin"
            ) &&

            item.active === true
    );

    return verifiedAdmin || null;
}

// ========================================
// RECORD ADMIN HISTORY
// ========================================

function recordHistory({
    admin,
    action,
    productId = null,
    productName = null,
    oldValue = null,
    newValue = null
}) {

    const historyEntry = {
        id: history.length + 1,

        adminId: admin.id,
        adminName: admin.name,
        adminEmail: admin.email,

        action,

        productId,
        productName,

        oldValue,
        newValue,

        date: new Date().toISOString()
    };

    history.push(historyEntry);

    saveHistory();
}

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

app.use(express.static("public"));


// ========================================
// PRODUCT API
// ========================================

app.get("/api/products", (req, res) => {

    res.json(products);

});

// ========================================
// CATEGORY API
// ========================================
app.get("/api/categories", (req, res) => {
    res.json(categories);
});

// ========================================
// HISTORY API
// ========================================
app.get("/api/history", (req, res) => {
    res.json(history);

});

// ========================================
// UNITS API
// ========================================
app.get("/api/units", (req, res) => {
    res.json(units);
});

// ========================================
// CUSTOMER PRODUCT API
// ========================================

app.get(
    "/api/customer/products",
    requireCustomerSession,
    (req, res) => {

        res.json(products);

    }
);

// ========================================
// CUSTOMER SESSION API
// ========================================

app.get(
    "/api/customer/session",
    requireCustomerSession,
    (req, res) => {

        res.json({
            authenticated: true,
            customer: {
                id: req.customer.id,
                fullName: req.customer.fullName,
                email: req.customer.email,
                phone: req.customer.phone
            }
        });

    }
);

// ========================================
// CUSTOMER LOGOUT API
// ========================================

app.post(
    "/api/customer/logout",
    requireCustomerSession,
    (req, res) => {

        const sessionToken =
            req.headers["x-customer-session-token"];

        customerSessions.delete(
            sessionToken
        );

        res.json({
            message: "Customer logout successful."
        });

    }
);

// ========================================
// ADD UNIT
// ========================================

app.post(
    "/api/units",
    requireAdminSession,
    (req, res) => {

        const unit =
            req.body.unit;

        const admin =
            req.body.admin;

        const verifiedAdmin =
            verifyAdmin(admin);

        if (!verifiedAdmin) {
            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });
        }

        if (
            typeof unit !== "string" ||
            !unit.trim()
        ) {
            return res.status(400).json({
                message:
                    "Unit name is required."
            });
        }

        const normalizedUnit =
            normalizeUnit(unit);

        const existingUnit =
            units.find(
                function (existing) {
                    return (
                        normalizeUnit(existing) ===
                        normalizedUnit
                    );
                }
            );

        if (existingUnit) {
            return res.status(409).json({
                message:
                    "Unit already exists."
            });
        }

        units.push(
            normalizedUnit
        );

        recordHistory({
            admin:
                verifiedAdmin,

            action:
                "Unit Added",

            oldValue:
                null,

            newValue:
                normalizedUnit
        });

        saveUnits();

        res.status(201).json({
            message:
                "Unit added successfully.",

            unit:
                normalizedUnit
        });
    });

// ========================================
// DELETE UNIT
// ========================================

app.delete(
    "/api/units/:unit",
    requireAdminSession,
    (req, res) => {

        const selectedUnit =
            decodeURIComponent(
                req.params.unit
            );

        const admin =
            req.body.admin;


        // ========================================
        // VERIFY ADMIN
        // ========================================

        const verifiedAdmin =
            verifyAdmin(admin);

        if (!verifiedAdmin) {

            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });

        }


        // ========================================
        // FIND UNIT
        // ========================================

        const unitIndex =
            units.findIndex(
                existingUnit =>
                    existingUnit.toLowerCase() ===
                    selectedUnit.toLowerCase()
            );


        if (unitIndex === -1) {

            return res.status(404).json({
                message:
                    "Unit not found."
            });

        }


        const unitToDelete =
            units[unitIndex];


        // ========================================
        // CHECK PRODUCTS USING UNIT
        // ========================================

        const productsUsingUnit =
            products.filter(
                product =>
                    product.unit.toLowerCase() ===
                    unitToDelete.toLowerCase()
            );


        if (productsUsingUnit.length > 0) {

            return res.status(409).json({

                message:
                    `Cannot delete "${unitToDelete}". ` +
                    `${productsUsingUnit.length} product(s) ` +
                    `are still using this unit.`

            });

        }


        // ========================================
        // DELETE UNIT
        // ========================================

        units.splice(
            unitIndex,
            1
        );


        // ========================================
        // RECORD HISTORY
        // ========================================

        recordHistory({

            admin:
                verifiedAdmin,

            action:
                "Unit Deleted",

            oldValue:
                unitToDelete,

            newValue:
                null

        });


        saveUnits();


        res.json({

            message:
                "Unit deleted successfully.",

            unit:
                unitToDelete

        });

    });

// ========================================
// ADD CATEGORY
// ========================================

app.post(
    "/api/categories",
    requireAdminSession,
    (req, res) => {

        const category =
            req.body.category;

        const admin =
            req.body.admin;

        const verifiedAdmin =
            verifyAdmin(admin);

        if (!verifiedAdmin) {
            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });
        }

        if (
            typeof category !== "string" ||
            !category.trim()
        ) {
            return res.status(400).json({
                message:
                    "Category name is required."
            });
        }

        const normalizedCategory =
            normalizeCategory(category);

        const existingCategory =
            categories.find(
                function (existing) {
                    return (
                        normalizeCategory(existing) ===
                        normalizedCategory
                    );
                }
            );

        if (existingCategory) {
            return res.status(409).json({
                message:
                    "Category already exists."
            });
        }

        categories.push(
            normalizedCategory
        );

        recordHistory({
            admin:
                verifiedAdmin,

            action:
                "Category Added",

            oldValue:
                null,

            newValue:
                normalizedCategory
        });

        saveCategories();

        res.status(201).json({
            message:
                "Category added successfully.",

            category:
                normalizedCategory
        });
    });

// ========================================
// DELETE CATEGORY
// ========================================

app.delete(
    "/api/categories/:category",
    requireAdminSession,
    (req, res) => {

        const category =
            decodeURIComponent(
                req.params.category
            );

        const admin =
            req.body.admin;


        // ========================================
        // VERIFY ADMIN
        // ========================================

        const verifiedAdmin =
            verifyAdmin(admin);

        if (!verifiedAdmin) {

            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });

        }


        // ========================================
        // FIND CATEGORY
        // ========================================

        const categoryIndex =
            categories.findIndex(
                existingCategory =>
                    existingCategory.toLowerCase() ===
                    category.toLowerCase()
            );


        if (categoryIndex === -1) {

            return res.status(404).json({
                message:
                    "Category not found."
            });

        }


        const selectedCategory =
            categories[categoryIndex];


        // ========================================
        // CHECK PRODUCTS
        // ========================================

        const productsInCategory =
            products.filter(
                product =>
                    product.category.toLowerCase() ===
                    selectedCategory.toLowerCase()
            );


        if (productsInCategory.length > 0) {

            return res.status(409).json({

                message:
                    `Cannot delete "${selectedCategory}". ` +
                    `${productsInCategory.length} product(s) ` +
                    `are still assigned to this category.`

            });

        }


        // ========================================
        // DELETE CATEGORY
        // ========================================

        const deletedCategory =
            categories.splice(
                categoryIndex,
                1
            )[0];


        // ========================================
        // RECORD HISTORY
        // ========================================

        recordHistory({

            admin:
                verifiedAdmin,

            action:
                "Category Deleted",

            oldValue:
                deletedCategory,

            newValue:
                null

        });


        saveCategories();


        res.json({

            message:
                "Category deleted successfully.",

            category:
                deletedCategory

        });

    });

// ========================================
// UPDATE PRODUCT
// ========================================

app.put(
    "/api/products/:id",
    requireAdminSession,
    (req, res) => {

        const productId = Number(req.params.id);
        const admin = req.body.admin;
        const verifiedAdmin = verifyAdmin(admin);


        if (!verifiedAdmin) {

            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });

        }

        const product =
            products.find(
                product =>
                    product.id === productId
            );

        if (!product) {

            return res.status(404).json({
                message:
                    "Product not found."
            });

        }

        const {
            name,
            category,
            unit,
            price
        } = req.body;


        // ========================================
        // VALIDATION
        // ========================================

        if (
            name === undefined ||
            category === undefined ||
            unit === undefined ||
            price === undefined
        ) {

            return res.status(400).json({
                message:
                    "All product fields are required."
            });

        }


        if (
            typeof name !== "string" ||
            !name.trim()
        ) {

            return res.status(400).json({
                message:
                    "Product name is required."
            });

        }


        if (
            typeof category !== "string" ||
            !category.trim()
        ) {

            return res.status(400).json({
                message:
                    "Category is required."
            });

        }


        if (
            typeof unit !== "string" ||
            !unit.trim()
        ) {

            return res.status(400).json({
                message:
                    "Unit is required."
            });

        }


        if (
            price === "" ||
            Number(price) < 0 ||
            Number.isNaN(Number(price))
        ) {

            return res.status(400).json({
                message:
                    "Price must be a valid non-negative number."
            });

        }


        // ========================================
        // SAVE OLD VALUES
        // ========================================

        const oldName =
            product.name;

        const oldCategory =
            product.category;

        const oldUnit =
            product.unit;

        const oldPrice =
            product.price;


        // ========================================
        // NORMALIZE NEW VALUES
        // ========================================

        const normalizedName =
            normalizeProductName(name);

        const normalizedCategory =
            ensureCategory(category);

        const normalizedUnit =
            ensureUnit(unit);

        const normalizedPrice =
            Number(price);


        // ========================================
        // APPLY NEW VALUES
        // ========================================

        product.name =
            normalizedName;

        product.category =
            normalizedCategory;

        product.unit =
            normalizedUnit;

        product.price =
            normalizedPrice;


        // ========================================
        // RECORD NAME CHANGE
        // ========================================

        if (
            oldName !==
            product.name
        ) {

            recordHistory({

                admin:
                    verifiedAdmin,

                action:
                    "Product Name Changed",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    oldName,

                newValue:
                    product.name

            });

        }


        // ========================================
        // RECORD CATEGORY CHANGE
        // ========================================

        if (
            oldCategory !==
            product.category
        ) {

            recordHistory({

                admin:
                    verifiedAdmin,

                action:
                    "Category Changed",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    oldCategory,

                newValue:
                    product.category

            });

        }


        // ========================================
        // RECORD UNIT CHANGE
        // ========================================

        if (
            oldUnit !==
            product.unit
        ) {

            recordHistory({

                admin:
                    verifiedAdmin,

                action:
                    "Unit Changed",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    oldUnit,

                newValue:
                    product.unit

            });

        }


        // ========================================
        // RECORD PRICE CHANGE
        // ========================================

        if (
            oldPrice !==
            product.price
        ) {

            recordHistory({

                admin:
                    verifiedAdmin,

                action:
                    "Price Changed",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    oldPrice,

                newValue:
                    product.price

            });

        }


        // ========================================
        // UPDATE LAST UPDATED DATE
        // ========================================

        product.lastUpdated =
            new Date().toLocaleDateString(
                "en-GB",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            );


        saveProducts();


        res.json({

            message:
                "Product updated successfully.",

            product:
                product

        });

    });

// ========================================
// BULK MOVE PRODUCTS TO ANOTHER CATEGORY
// ========================================

app.put("/api/products/bulk/category", requireAdminSession, (req, res) => {
    const {
        productIds,
        category,
        admin
    } = req.body;


    // ========================================
    // VERIFY ADMIN
    // ========================================

    const verifiedAdmin =
        verifyAdmin(admin);

    if (!verifiedAdmin) {

        return res.status(401).json({
            message:
                "Admin authentication is invalid."
        });

    }


    // ========================================
    // VALIDATION
    // ========================================

    if (
        !Array.isArray(productIds) ||
        productIds.length === 0
    ) {

        return res.status(400).json({
            message:
                "No products were selected."
        });

    }


    if (
        typeof category !== "string" ||
        !category.trim()
    ) {

        return res.status(400).json({
            message:
                "Category is required."
        });

    }


    // ========================================
    // NORMALIZE AND REGISTER CATEGORY
    // ========================================

    const selectedCategory =
        ensureCategory(category);

    if (!selectedCategory) {

        return res.status(400).json({
            message:
                "Category is required."
        });

    }


    // ========================================
    // UPDATE PRODUCTS
    // ========================================

    let updatedCount = 0;


    productIds.forEach(function (productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );


        if (!product) {
            return;
        }


        const oldCategory =
            product.category;


        product.category =
            selectedCategory;


        product.lastUpdated =
            new Date().toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );


        // ========================================
        // RECORD HISTORY
        // ========================================

        if (
            oldCategory !==
            selectedCategory
        ) {

            recordHistory({

                admin:
                    verifiedAdmin,

                action:
                    "Category Changed",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    oldCategory,

                newValue:
                    selectedCategory

            });

        }


        updatedCount++;

    });


    // ========================================
    // CHECK UPDATE RESULT
    // ========================================

    if (updatedCount === 0) {

        return res.status(404).json({
            message:
                "No matching products were found."
        });

    }


    // ========================================
    // SAVE PRODUCTS
    // ========================================

    saveProducts();


    res.json({

        message:
            "Products moved successfully.",

        updatedCount:
            updatedCount,

        category:
            selectedCategory

    });

});

// ========================================
// BULK CHANGE PRODUCT PRICES
// ========================================

app.put("/api/products/bulk/price", requireAdminSession, (req, res) => {

    const { productIds, price, admin } = req.body;

    const verifiedAdmin = verifyAdmin(admin);

    if (!verifiedAdmin) {
        return res.status(401).json({
            message: "Admin authentication is invalid."
        });
    }

    if (
        !Array.isArray(productIds) ||
        productIds.length === 0
    ) {
        return res.status(400).json({
            message:
                "No products were selected."
        });
    }

    if (
        price === undefined ||
        price === null ||
        price === "" ||
        isNaN(Number(price)) ||
        Number(price) < 0
    ) {
        return res.status(400).json({
            message:
                "Please enter a valid price."
        });
    }

    const newPrice =
        Number(price);

    let updatedCount = 0;

    productIds.forEach(function (productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );

        if (!product) {
            return;
        }

        const oldPrice = product.price;

        product.price = newPrice;

        product.lastUpdated =
            new Date().toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        if (oldPrice !== newPrice) {

            recordHistory({
                admin: verifiedAdmin,
                action: "Price Changed",
                productId: product.id,
                productName: product.name,
                oldValue: oldPrice,
                newValue: newPrice
            });
        }

        updatedCount++;
    });

    if (updatedCount === 0) {
        return res.status(404).json({
            message:
                "No matching products were found."
        });
    }

    saveProducts();

    res.json({
        message:
            "Prices changed successfully.",
        updatedCount:
            updatedCount
    });

});

// ========================================
// BULK CHANGE UNIT
// ========================================

app.put("/api/products/bulk/unit", requireAdminSession, (req, res) => {

    const {
        productIds,
        unit,
        admin
    } = req.body;

    const verifiedAdmin =
        verifyAdmin(admin);

    if (!verifiedAdmin) {

        return res.status(401).json({
            message:
                "Admin authentication is invalid."
        });

    }

    if (
        !Array.isArray(productIds) ||
        productIds.length === 0
    ) {

        return res.status(400).json({
            message:
                "No products were selected."
        });

    }

    if (
        typeof unit !== "string" ||
        !unit.trim()
    ) {

        return res.status(400).json({
            message:
                "Unit is required."
        });

    }

    // ========================================
    // NORMALIZE AND REGISTER THE NEW UNIT
    // ========================================

    const newUnit =
        ensureUnit(unit);

    if (!newUnit) {

        return res.status(400).json({
            message:
                "Unit is required."
        });

    }

    let updatedCount = 0;

    productIds.forEach(function (productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );

        if (!product) {
            return;
        }

        const oldUnit =
            product.unit;

        product.unit =
            newUnit;

        product.lastUpdated =
            new Date().toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        if (oldUnit !== newUnit) {

            recordHistory({
                admin:
                    verifiedAdmin,

                action:
                    "Unit Changed",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    oldUnit,

                newValue:
                    newUnit
            });

        }

        updatedCount++;

    });

    if (updatedCount === 0) {

        return res.status(404).json({
            message:
                "No matching products were found."
        });

    }

    saveProducts();

    res.json({
        message:
            "Units changed successfully.",

        updatedCount:
            updatedCount,

        unit:
            newUnit
    });

});

// ========================================
// BULK DELETE PRODUCTS
// ========================================

app.delete("/api/products/bulk", requireAdminSession, (req, res) => {

    const {
        productIds,
        admin
    } = req.body;


    // ========================================
    // VERIFY ADMIN
    // ========================================

    const verifiedAdmin =
        verifyAdmin(admin);

    if (!verifiedAdmin) {

        return res.status(401).json({
            message:
                "Admin authentication is invalid."
        });

    }


    // ========================================
    // VALIDATION
    // ========================================

    if (
        !Array.isArray(productIds) ||
        productIds.length === 0
    ) {

        return res.status(400).json({
            message:
                "No products were selected."
        });

    }


    // ========================================
    // FIND SELECTED PRODUCTS
    // ========================================

    const idsToDelete =
        productIds.map(function (id) {

            return String(id);

        });


    const productsToDelete =
        products.filter(function (product) {

            return idsToDelete.includes(
                String(product.id)
            );

        });


    if (productsToDelete.length === 0) {

        return res.status(404).json({
            message:
                "No matching products were found."
        });

    }


    // ========================================
    // RECORD HISTORY
    // ========================================

    productsToDelete.forEach(
        function (product) {

            recordHistory({

                admin:
                    verifiedAdmin,

                action:
                    "Product Deleted",

                productId:
                    product.id,

                productName:
                    product.name,

                oldValue:
                    product.name,

                newValue:
                    null

            });
        }
    );


    // ========================================
    // REMOVE PRODUCTS
    // ========================================

    const remainingProducts =
        products.filter(function (product) {

            return !idsToDelete.includes(
                String(product.id)
            );

        });


    products.length = 0;


    remainingProducts.forEach(
        function (product) {

            products.push(product);

        }
    );


    // ========================================
    // SAVE PRODUCTS
    // ========================================

    saveProducts();


    res.json({

        message:
            "Products deleted successfully.",

        deletedCount:
            productsToDelete.length

    });

});

// ========================================
// DELETE PRODUCT
// ========================================

app.delete(
    "/api/products/:id",
    requireAdminSession,
    (req, res) => {

        const productId = Number(req.params.id);

        const admin =
            req.body.admin;

        // ========================================
        // VERIFY ADMIN
        // ========================================

        const verifiedAdmin =
            verifyAdmin(admin);

        if (!verifiedAdmin) {

            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });

        }


        // ========================================
        // FIND PRODUCT
        // ========================================

        const productIndex =
            products.findIndex(
                product =>
                    product.id === productId
            );


        if (productIndex === -1) {

            return res.status(404).json({
                message:
                    "Product not found."
            });

        }


        // ========================================
        // DELETE PRODUCT
        // ========================================

        const deletedProduct =
            products.splice(
                productIndex,
                1
            )[0];


        // ========================================
        // RECORD HISTORY
        // ========================================

        recordHistory({
            admin: verifiedAdmin,
            action: "Product Deleted",
            productId: deletedProduct.id,
            productName: deletedProduct.name,
            oldValue: deletedProduct.name,
            newValue: null
        });

        // ========================================
        // SAVE PRODUCTS
        // ========================================

        saveProducts();


        res.json({

            message:
                "Product deleted successfully.",

            product:
                deletedProduct

        });

    });

// ========================================
// ADD PRODUCT
// ========================================

app.post(
    "/api/products",
    requireAdminSession,
    (req, res) => {

        const {
            name,
            category,
            unit,
            price,
            admin
        } = req.body;

        const verifiedAdmin =
            verifyAdmin(admin);

        if (!verifiedAdmin) {
            return res.status(401).json({
                message:
                    "Admin authentication is invalid."
            });
        }

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof unit !== "string" ||
            !unit.trim() ||
            price === undefined ||
            price === ""
        ) {
            return res.status(400).json({
                message:
                    "All product fields are required."
            });
        }

        // ========================================
        // NORMALIZE PRODUCT DATA
        // ========================================

        const normalizedName =
            normalizeProductName(name);

        const normalizedCategory =
            ensureCategory(category);

        const normalizedUnit =
            ensureUnit(unit);

        const newId =
            products.length > 0
                ? Math.max(
                    ...products.map(
                        product => product.id
                    )
                ) + 1
                : 1;

        const newProduct = {

            id: newId,

            name:
                normalizedName,

            category:
                normalizedCategory,

            unit:
                normalizedUnit,

            price:
                Number(price),

            lastUpdated:
                new Date().toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                )
        };

        products.push(
            newProduct
        );

        recordHistory({
            admin:
                verifiedAdmin,

            action:
                "Product Added",

            productId:
                newProduct.id,

            productName:
                newProduct.name,

            oldValue:
                null,

            newValue:
                null
        });

        saveProducts();

        res.status(201).json({

            message:
                "Product added successfully.",

            product:
                newProduct
        });
    });

// ========================================
// BULK PRODUCT IMPORT
// SUPER ADMIN ONLY
// ========================================

app.post(
    "/api/admin/products/import",
    requireSuperAdmin,
    (req, res) => {

        const {
            products: importedProducts
        } = req.body;


        // ========================================
        // VALIDATE REQUEST
        // ========================================

        if (
            !Array.isArray(importedProducts) ||
            importedProducts.length === 0
        ) {

            return res.status(400).json({
                message:
                    "No products were provided for import."
            });

        }


        // ========================================
        // PREPARE VALIDATION
        // ========================================

        const errors = [];

        const preparedProducts = [];

        const importProductNames =
            new Set();


        // ========================================
        // VALIDATE EVERY IMPORTED PRODUCT
        // ========================================

        importedProducts.forEach(
            function (item, index) {

                const productNumber =
                    index + 1;


                if (!item || typeof item !== "object") {

                    errors.push(
                        `SN ${productNumber}: Invalid product data.`
                    );

                    return;

                }


                const rawName =
                    typeof item.name === "string"
                        ? item.name
                        : "";

                const rawCategory =
                    typeof item.category === "string"
                        ? item.category
                        : "";

                const rawUnit =
                    typeof item.unit === "string"
                        ? item.unit
                        : "";


                // ========================================
                // REQUIRED FIELDS
                // ========================================

                if (
                    !rawName.trim() ||
                    !rawCategory.trim() ||
                    !rawUnit.trim()
                ) {

                    errors.push(
                        `SN ${productNumber}: Product Name, Category and Unit are required.`
                    );

                    return;

                }


                // ========================================
                // NORMALIZE PRODUCT DATA
                // ========================================

                const normalizedName =
                    normalizeProductName(
                        rawName
                    );

                const normalizedCategory =
                    normalizeCategory(
                        rawCategory
                    );


                // ========================================
                // NORMALIZE IMPORT UNIT
                // ========================================

                const cleanedUnit =
                    cleanText(rawUnit);


                const unitWithPer =
                    cleanedUnit
                        .toLowerCase()
                        .startsWith("per ")
                        ? cleanedUnit
                        : `Per ${cleanedUnit}`;


                const normalizedUnit =
                    normalizeUnit(
                        unitWithPer
                    );


                // ========================================
                // CHECK DUPLICATE NAMES
                // INSIDE THIS IMPORT
                // ========================================

                const nameKey =
                    normalizedName.toLowerCase();


                if (
                    importProductNames.has(
                        nameKey
                    )
                ) {

                    errors.push(
                        `SN ${productNumber}: Duplicate product name "${normalizedName}".`
                    );

                    return;

                }


                importProductNames.add(
                    nameKey
                );


                // ========================================
                // CHECK AGAINST EXISTING PRODUCTS
                // ========================================

                const existingProduct =
                    products.find(
                        function (product) {

                            return (
                                typeof product.name === "string" &&
                                product.name
                                    .trim()
                                    .toLowerCase() ===
                                normalizedName
                                    .trim()
                                    .toLowerCase()
                            );

                        }
                    );


                if (existingProduct) {

                    errors.push(
                        `SN ${productNumber}: Product "${normalizedName}" already exists.`
                    );

                    return;

                }


                // ========================================
                // STORE PREPARED PRODUCT
                // ========================================

                preparedProducts.push({

                    productNumber,

                    name:
                        normalizedName,

                    category:
                        normalizedCategory,

                    unit:
                        normalizedUnit

                });

            }
        );


        // ========================================
        // STOP IF ANY VALIDATION ERROR EXISTS
        // ========================================

        if (errors.length > 0) {

            return res.status(400).json({

                message:
                    "Product import validation failed.",

                errors:
                    errors

            });

        }


        // ========================================
        // CALCULATE STARTING PRODUCT ID
        // ========================================

        let nextProductId =
            products.length > 0
                ? Math.max(
                    ...products.map(
                        function (product) {
                            return Number(product.id);
                        }
                    )
                ) + 1
                : 1;


        // ========================================
        // PREPARE NEW CATEGORIES
        // ========================================

        const categoriesToAdd = [];


        preparedProducts.forEach(
            function (product) {

                const existingCategory =
                    categories.find(
                        function (category) {

                            return (
                                normalizeCategory(
                                    category
                                ) ===
                                product.category
                            );

                        }
                    );


                const alreadyPrepared =
                    categoriesToAdd.find(
                        function (category) {

                            return (
                                normalizeCategory(
                                    category
                                ) ===
                                product.category
                            );

                        }
                    );


                if (
                    !existingCategory &&
                    !alreadyPrepared
                ) {

                    categoriesToAdd.push(
                        product.category
                    );

                }

            }
        );


        // ========================================
        // PREPARE NEW UNITS
        // ========================================

        const unitsToAdd = [];


        preparedProducts.forEach(
            function (product) {

                const existingUnit =
                    units.find(
                        function (unit) {

                            return (
                                normalizeUnit(
                                    unit
                                ) ===
                                product.unit
                            );

                        }
                    );


                const alreadyPrepared =
                    unitsToAdd.find(
                        function (unit) {

                            return (
                                normalizeUnit(
                                    unit
                                ) ===
                                product.unit
                            );

                        }
                    );


                if (
                    !existingUnit &&
                    !alreadyPrepared
                ) {

                    unitsToAdd.push(
                        product.unit
                    );

                }

            }
        );


        // ========================================
        // ADD NEW CATEGORIES
        // ========================================

        categoriesToAdd.forEach(
            function (category) {

                categories.push(
                    category
                );

            }
        );


        // ========================================
        // ADD NEW UNITS
        // ========================================

        unitsToAdd.forEach(
            function (unit) {

                units.push(
                    unit
                );

            }
        );


        // ========================================
        // CREATE PRODUCTS
        // ========================================

        const newProducts = [];


        preparedProducts.forEach(
            function (product) {

                const newProduct = {

                    id:
                        nextProductId,

                    name:
                        product.name,

                    category:
                        product.category,

                    unit:
                        product.unit,

                    price:
                        null,

                    lastUpdated:
                        new Date().toLocaleDateString(
                            "en-GB",
                            {
                                day:
                                    "2-digit",

                                month:
                                    "short",

                                year:
                                    "numeric"
                            }
                        )

                };


                newProducts.push(
                    newProduct
                );


                nextProductId++;

            }
        );


        // ========================================
        // ADD PRODUCTS TO MEMORY
        // ========================================

        newProducts.forEach(
            function (product) {

                products.push(
                    product
                );

            }
        );


        // ========================================
        // SAVE ALL IMPORTED DATA
        // ========================================

        saveCategories();

        saveUnits();

        saveProducts();


        // ========================================
        // RESPONSE
        // ========================================

        res.status(201).json({

            message:
                "Products imported successfully.",

            importedCount:
                newProducts.length,

            categoriesCreated:
                categoriesToAdd.length,

            unitsCreated:
                unitsToAdd.length,

            products:
                newProducts

        });

    }
);

// ========================================
// ADMIN LOGIN
// ========================================

app.post("/api/admin/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    const admin =
        admins.find(function (item) {

            if (
                item.email.toLowerCase() !==
                email.trim().toLowerCase()
            ) {
                return false;
            }

            // ========================================
            // CHECK ADMIN STATUS
            // ========================================

            if (item.active !== true) {
                return false;
            }

            // ========================================
            // HASHED PASSWORD
            // ========================================

            if (item.passwordHash) {

                const passwordHash =
                    createAdminPasswordHash(
                        password
                    );

                return (
                    passwordHash ===
                    item.passwordHash
                );
            }

            // ========================================
            // LEGACY PLAIN-TEXT PASSWORD
            // ========================================

            if (item.password === password) {

                item.passwordHash =
                    createAdminPasswordHash(
                        password
                    );

                delete item.password;

                saveAdmins();

                return true;
            }

            return false;
        });

    if (!admin) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    const sessionToken =
        createAdminSession(admin);

    res.json({
        message: "Admin login successful.",
        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        },
        sessionToken: sessionToken
    });
});

// ========================================
// CUSTOMER REGISTRATION
// ========================================

app.post("/api/auth/register", async (req, res) => {

    const {
        fullName,
        email,
        phone,
        password,
        confirmPassword
    } = req.body;

    // Validate required fields
    if (
        !fullName ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
        return res.status(400).json({
            message: "Passwords do not match."
        });
    }

    // Validate phone number
    if (!/^[0-9]{11}$/.test(phone)) {
        return res.status(400).json({
            message: "Phone number must contain exactly 11 digits."
        });
    }

    // Check if email already exists
    const existingCustomer = customers.find(
        function (customer) {
            return customer.email.toLowerCase() ===
                email.trim().toLowerCase();
        }
    );

    if (existingCustomer) {
        return res.status(409).json({
            message: "An account with this email already exists."
        });
    }

    // Create new customer
    const passwordHash = crypto
        .scryptSync(
            password,
            "baban-yasir-customer-salt",
            64
        )
        .toString("hex");

    const newCustomer = {
        id: customers.length + 1,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash: passwordHash
    };

    customers.push(newCustomer);

    saveCustomers();


    // ========================================
    // SEND CUSTOMER WELCOME EMAIL
    // ========================================

    try {

        await sendCustomerWelcomeEmail(
            newCustomer.email,
            newCustomer.fullName
        );

    } catch (error) {

        console.error(
            "Customer welcome email failed:",
            error
        );

        // The customer account has already
        // been successfully created.
        // Email failure must not cancel registration.

    }

    res.status(201).json({
        message:
            "Customer account created successfully. A welcome email has been sent to your email address."
    });
});

// ========================================
// CUSTOMER LOGIN
// ========================================

app.post("/api/auth/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    // ========================================
    // VALIDATE REQUIRED FIELDS
    // ========================================

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    // ========================================
    // FIND CUSTOMER
    // ========================================

    const customer = customers.find(
        function (item) {
            return (
                item.email.toLowerCase() ===
                email.trim().toLowerCase()
            );
        }
    );

    if (!customer) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    // ========================================
    // HASH ENTERED PASSWORD
    // ========================================

    const passwordHash = crypto
        .scryptSync(
            password,
            "baban-yasir-customer-salt",
            64
        )
        .toString("hex");

    // ========================================
    // COMPARE PASSWORD
    // ========================================

    if (passwordHash !== customer.passwordHash) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    // ========================================
    // CUSTOMER LOGIN SUCCESS
    // ========================================

    const sessionToken =
        createCustomerSession(customer);

    res.json({
        message: "Customer login successful.",

        customer: {
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone
        },

        sessionToken: sessionToken
    });

});

// ========================================
// CUSTOMER FORGOT PASSWORD API
// ========================================

app.post(
    "/api/auth/forgot-password",
    async (req, res) => {

        const email =
            typeof req.body.email === "string"
                ? req.body.email
                    .trim()
                    .toLowerCase()
                : "";

        if (!email) {

            return res.status(400).json({
                message:
                    "Please enter your email address."
            });

        }

        const customer =
            customers.find(function (item) {

                return (
                    typeof item.email === "string" &&
                    item.email
                        .trim()
                        .toLowerCase() === email
                );

            });

        /*
         * We deliberately return the same
         * message whether the email exists
         * or not.
         *
         * This prevents people from discovering
         * which email addresses have accounts.
         */

        if (!customer) {

            return res.json({
                message:
                    "If an account exists for this email, password reset instructions will be provided."
            });

        }

        const resetToken =
            crypto.randomBytes(32).toString("hex");

        const expiresAt =
            Date.now() + (15 * 60 * 1000);

        // Invalidate previous reset tokens
        // belonging to this customer.
        for (
            const [
                existingToken,
                resetData
            ] of passwordResetTokens.entries()
        ) {

            if (
                Number(resetData.customerId) ===
                Number(customer.id)
            ) {

                passwordResetTokens.delete(
                    existingToken
                );

            }

        }

        passwordResetTokens.set(
            resetToken,
            {
                customerId: customer.id,
                expiresAt: expiresAt
            }
        );

        const resetLink =
            `${process.env.APP_BASE_URL}/reset-password.html?token=${resetToken}`;

        try {

            await sendPasswordResetEmail(
                customer.email,
                resetLink
            );

        } catch (error) {

            console.error(
                "Password reset email failed:",
                error
            );

        }

        return res.json({
            message:
                "If an account exists for this email, password reset instructions will be provided."
        });

    }
);

// ========================================
// ADMIN FORGOT PASSWORD
// ========================================

app.post(
    "/api/admin/auth/forgot-password",
    async (req, res) => {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const admin =
            admins.find(function (item) {

                return (
                    item.email.toLowerCase() ===
                    normalizedEmail
                );

            });

        // ========================================
        // GENERIC RESPONSE
        // ========================================

        if (!admin) {

            return res.json({
                message:
                    "If an administrator account exists for this email, password reset instructions will be provided."
            });

        }

        // ========================================
        // CREATE RESET TOKEN
        // ========================================

        const resetToken =
            crypto.randomBytes(32).toString("hex");

        const expiresAt =
            Date.now() +
            (15 * 60 * 1000);

        // ========================================
        // INVALIDATE OLD TOKEN
        // ========================================

        for (
            const [token, resetData]
            of adminPasswordResetTokens
        ) {

            if (
                Number(resetData.adminId) ===
                Number(admin.id)
            ) {

                adminPasswordResetTokens.delete(
                    token
                );

            }

        }

        // ========================================
        // STORE NEW TOKEN
        // ========================================

        adminPasswordResetTokens.set(
            resetToken,
            {
                adminId: admin.id,
                expiresAt: expiresAt
            }
        );

        // ========================================
        // CREATE RESET LINK
        // ========================================

        const resetLink =
            `${process.env.APP_BASE_URL}/admin/admin-reset-password.html?token=${resetToken}`;

        // ========================================
        // SEND EMAIL
        // ========================================

        try {

            await sendAdminPasswordResetEmail(
                admin.email,
                resetLink
            );

        } catch (error) {

            console.error(
                "Admin password reset email failed:",
                error
            );

        }

        // ========================================
        // GENERIC RESPONSE
        // ========================================

        return res.json({
            message:
                "If an administrator account exists for this email, password reset instructions will be provided."
        });

    }
);

// ========================================
// CUSTOMER RESET PASSWORD API
// ========================================

app.post(
    "/api/auth/reset-password",
    (req, res) => {

        const token =
            typeof req.body.token === "string"
                ? req.body.token.trim()
                : "";

        const password =
            typeof req.body.password === "string"
                ? req.body.password
                : "";

        if (!token || !password) {

            return res.status(400).json({
                message:
                    "Reset token and new password are required."
            });

        }

        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long."
            });

        }

        const resetData =
            passwordResetTokens.get(token);

        if (!resetData) {

            return res.status(400).json({
                message:
                    "Invalid or expired reset token."
            });

        }

        if (Date.now() > resetData.expiresAt) {

            passwordResetTokens.delete(token);

            return res.status(400).json({
                message:
                    "Invalid or expired reset token."
            });

        }

        const customer =
            customers.find(function (item) {

                return (
                    Number(item.id) ===
                    Number(resetData.customerId)
                );

            });

        if (!customer) {

            passwordResetTokens.delete(token);

            return res.status(400).json({
                message:
                    "Customer account could not be found."
            });

        }

        const passwordHash =
            crypto
                .scryptSync(
                    password,
                    "baban-yasir-customer-salt",
                    64
                )
                .toString("hex");

        customer.passwordHash =
            passwordHash;

        delete customer.password;

        saveCustomers();

        passwordResetTokens.delete(token);

        return res.json({
            message:
                "Password reset successful. You can now log in."
        });

    }
);

// ========================================
// ADMIN RESET PASSWORD
// ========================================

app.post(
    "/api/admin/auth/reset-password",
    (req, res) => {

        const {
            token,
            password,
            confirmPassword
        } = req.body;

        // ========================================
        // VALIDATE INPUT
        // ========================================

        if (
            !token ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                message:
                    "Token, password and confirmation are required."
            });

        }

        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long."
            });

        }

        if (password !== confirmPassword) {

            return res.status(400).json({
                message:
                    "Passwords do not match."
            });

        }

        // ========================================
        // FIND RESET TOKEN
        // ========================================

        const resetData =
            adminPasswordResetTokens.get(
                token
            );

        if (!resetData) {

            return res.status(400).json({
                message:
                    "Invalid or expired reset token."
            });

        }

        // ========================================
        // CHECK EXPIRATION
        // ========================================

        if (
            Date.now() >
            resetData.expiresAt
        ) {

            adminPasswordResetTokens.delete(
                token
            );

            return res.status(400).json({
                message:
                    "Invalid or expired reset token."
            });

        }

        // ========================================
        // FIND ADMIN
        // ========================================

        const admin =
            admins.find(function (item) {

                return (
                    Number(item.id) ===
                    Number(resetData.adminId)
                );

            });

        if (!admin) {

            adminPasswordResetTokens.delete(
                token
            );

            return res.status(404).json({
                message:
                    "Administrator account not found."
            });

        }

        // ========================================
        // CREATE NEW PASSWORD HASH
        // ========================================

        const passwordHash =
            createAdminPasswordHash(
                password
            );

        admin.passwordHash =
            passwordHash;

        // ========================================
        // REMOVE LEGACY PASSWORD
        // ========================================

        delete admin.password;

        // ========================================
        // SAVE ADMIN ACCOUNT
        // ========================================

        saveAdmins();

        // ========================================
        // INVALIDATE RESET TOKEN
        // ========================================

        adminPasswordResetTokens.delete(
            token
        );

        // ========================================
        // INVALIDATE EXISTING ADMIN SESSIONS
        // ========================================

        for (
            const [
                sessionToken,
                sessionData
            ]
            of adminSessions
        ) {

            if (
                Number(sessionData.adminId) ===
                Number(admin.id)
            ) {

                adminSessions.delete(
                    sessionToken
                );

            }

        }

        // ========================================
        // RECORD PASSWORD RESET
        // ========================================

        recordHistory({
            admin: admin,
            action:
                "Admin password reset",
            productId: null,
            productName: null,
            oldValue: null,
            newValue:
                "Administrator password changed"
        });

        return res.json({
            message:
                "Admin password reset successful. You can now log in."
        });

    }
);

// ========================================
// VERIFY ADMIN SESSION
// ========================================

app.get("/api/admin/session", (req, res) => {

    const sessionToken =
        req.headers["x-admin-session-token"];

    if (!sessionToken) {

        return res.status(401).json({
            authenticated: false,
            message: "Admin session is required."
        });

    }

    const session =
        adminSessions.get(sessionToken);

    if (!session) {

        return res.status(401).json({
            authenticated: false,
            message: "Admin session is invalid or expired."
        });

    }

    const admin =
        admins.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(session.adminId) &&

                    (
                        item.role === "admin" ||
                        item.role === "superadmin"
                    ) &&

                    item.active === true
                );

            }
        );

    if (!admin) {

        adminSessions.delete(
            sessionToken
        );

        return res.status(401).json({
            authenticated: false,
            message: "Administrator account no longer exists."
        });

    }

    res.json({

        authenticated: true,

        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }

    });

});

// ========================================
// SERVER
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});