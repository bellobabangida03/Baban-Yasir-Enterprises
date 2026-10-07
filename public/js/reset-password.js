// ========================================
// PASSWORD VISIBILITY
// ========================================

function setupPasswordToggle(
    inputId,
    buttonId
) {

    const passwordInput =
        document.querySelector(inputId);

    const togglePassword =
        document.querySelector(buttonId);

    if (
        !passwordInput ||
        !togglePassword
    ) {
        return;
    }

    togglePassword.addEventListener(
        "click",
        function () {

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";

                togglePassword.textContent =
                    "🙈";

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type =
                    "password";

                togglePassword.textContent =
                    "👁";

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        }
    );
}

setupPasswordToggle(
    "#password",
    "#toggle-password"
);

setupPasswordToggle(
    "#confirm-password",
    "#toggle-confirm-password"
);

// ========================================
// RESET PASSWORD
// ========================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const resetToken =
    urlParams.get("token");

const tokenInput =
    document.querySelector("#token");

if (tokenInput && resetToken) {

    tokenInput.value =
        resetToken;
}

const resetPasswordForm =
    document.querySelector("#reset-password-form");

if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const token =
                document
                    .querySelector("#token")
                    .value
                    .trim();

            const password =
                document
                    .querySelector("#password")
                    .value;

            const confirmPassword =
                document
                    .querySelector("#confirm-password")
                    .value;

            if (!token) {

                alert(
                    "Please enter your reset token."
                );

                return;
            }

            if (password.length < 8) {

                alert(
                    "Password must be at least 8 characters long."
                );

                return;
            }

            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        "/api/auth/reset-password",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                token: token,
                                password: password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(data.message);

                    return;
                }

                alert(data.message);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Password reset failed:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }

        }
    );

}