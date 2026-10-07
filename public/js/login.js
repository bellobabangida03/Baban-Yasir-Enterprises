// ========================================
// PASSWORD VISIBILITY
// ========================================

const passwordInput =
    document.querySelector("#password");

const togglePassword =
    document.querySelector("#toggle-password");

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

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

// ================================================
// LOGIN FORM
// ================================================

const form = document.querySelector("form");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.querySelector("#email");

    const password =
        document.querySelector("#password");

    // ========================================
    // FRONTEND VALIDATION
    // ========================================

    if (
        email.value.trim() === "" ||
        password.value === ""
    ) {
        return;
    }

    // ========================================
    // SEND LOGIN REQUEST
    // ========================================

    try {

        const response =
            await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email:
                            email.value.trim(),

                        password:
                            password.value
                    })
                }
            );

        const data =
            await response.json();

        // ========================================
        // LOGIN FAILED
        // ========================================

        if (!response.ok) {

            alert(data.message);

            return;
        }

        // ========================================
        // LOGIN SUCCESSFUL
        // ========================================

        // No success alert.
        // Customer proceeds directly to the catalogue.

        // ========================================
        // STORE CUSTOMER SESSION
        // ========================================

        sessionStorage.setItem(
            "customer",
            JSON.stringify(data.customer)
        );

        sessionStorage.setItem(
            "customerSessionToken",
            data.sessionToken
        );

        // ========================================
        // GO TO CUSTOMER CATALOG
        // ========================================

        window.location.href =
            "catalog.html";

    } catch (error) {

        console.error(
            "Customer login error:",
            error
        );

        alert(
            "Unable to connect to the server. Please try again."
        );
    }
});