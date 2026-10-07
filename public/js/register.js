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
// REGISTRATION FORM
// ========================================

const form = document.querySelector("form");

const fullName = document.querySelector("#full-name");
const email = document.querySelector("#email");
const phone = document.querySelector("#phone");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirm-password");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    // ========================================
    // PASSWORD CONFIRMATION
    // ========================================

    if (password.value !== confirmPassword.value) {

        confirmPassword.setCustomValidity(
            "Passwords do not match."
        );

        confirmPassword.reportValidity();

        return;
    }

    confirmPassword.setCustomValidity("");

    // ========================================
    // SEND REGISTRATION TO SERVER
    // ========================================

    try {

        const response = await fetch(
            "/api/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    fullName: fullName.value,
                    email: email.value,
                    phone: phone.value,
                    password: password.value,
                    confirmPassword:
                        confirmPassword.value
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        // ========================================
        // REGISTRATION SUCCESS
        // ========================================

        alert(data.message);

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(
            "Customer registration error:",
            error
        );

        alert(
            "Unable to create your account. Please try again."
        );
    }
});