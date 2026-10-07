// ========================================
// ADMIN RESET PASSWORD
// ========================================

const form =
    document.querySelector("#reset-password-form");

const passwordInput =
    document.querySelector("#password");

const confirmPasswordInput =
    document.querySelector("#confirm-password");

const message =
    document.querySelector("#reset-message");


// ========================================
// PASSWORD VISIBILITY
// ========================================

function setupPasswordToggle(
    input,
    button
) {

    if (!input || !button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            if (
                input.type ===
                "password"
            ) {

                input.type = "text";

                button.textContent =
                    "🙈";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                input.type =
                    "password";

                button.textContent =
                    "👁";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        }
    );
}


setupPasswordToggle(
    passwordInput,
    document.querySelector(
        "#toggle-password"
    )
);

setupPasswordToggle(
    confirmPasswordInput,
    document.querySelector(
        "#toggle-confirm-password"
    )
);


// ========================================
// GET RESET TOKEN
// ========================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const token =
    urlParams.get("token");


// ========================================
// FORM SUBMISSION
// ========================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        message.textContent = "";
        message.style.color = "";


        // ========================================
        // VALIDATE TOKEN
        // ========================================

        if (!token) {

            message.textContent =
                "Invalid or missing reset token.";

            message.style.color =
                "red";

            return;
        }


        // ========================================
        // VALIDATE PASSWORD
        // ========================================

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        if (password.length < 8) {

            message.textContent =
                "Password must be at least 8 characters long.";

            message.style.color =
                "red";

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            message.textContent =
                "Passwords do not match.";

            message.style.color =
                "red";

            return;
        }


        // ========================================
        // SEND RESET REQUEST
        // ========================================

        try {

            const response =
                await fetch(
                    "/api/admin/auth/reset-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                token:
                                    token,

                                password:
                                    password,

                                confirmPassword:
                                    confirmPassword
                            })
                    }
                );


            const data =
                await response.json();


            // ========================================
            // HANDLE ERROR
            // ========================================

            if (!response.ok) {

                message.textContent =
                    data.message ||
                    "Password reset failed.";

                message.style.color =
                    "red";

                return;
            }


            // ========================================
            // SUCCESS
            // ========================================

            message.textContent =
                data.message ||
                "Admin password reset successful.";

            message.style.color =
                "green";


            form.reset();


            // ========================================
            // RETURN TO ADMIN LOGIN
            // ========================================

            setTimeout(
                function () {

                    window.location.href =
                        "login.html";

                },
                2000
            );


        } catch (error) {

            console.error(
                "Admin password reset error:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";

            message.style.color =
                "red";

        }

    }
);