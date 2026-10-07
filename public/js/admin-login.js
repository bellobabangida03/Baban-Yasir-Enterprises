const form = document.querySelector("form");

const passwordInput =
    document.querySelector("#password");

const togglePassword =
    document.querySelector("#toggle-password");

togglePassword.addEventListener(
    "click",
    function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.textContent = "🙈";

            togglePassword.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            togglePassword.textContent = "👁";

            togglePassword.setAttribute(
                "aria-label",
                "Show password"
            );
        }
    }
);

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.querySelector("#email");
    const password = document.querySelector("#password");

    const emailValue = email.value.trim();
    const passwordValue = password.value;

    // ========================================
    // FRONTEND VALIDATION
    // ========================================

    if (emailValue === "" || passwordValue === "") {
        alert("Please enter your email and password.");
        return;
    }

    try {

        // ========================================
        // SEND LOGIN REQUEST TO SERVER
        // ========================================

        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: emailValue,
                password: passwordValue
            })
        });

        const data = await response.json();

        // ========================================
        // LOGIN FAILED
        // ========================================

        if (!response.ok) {
            alert(data.message);
            return;
        }

        // ========================================
        // SAVE ADMIN SESSION
        // ========================================

        sessionStorage.setItem(
            "admin",
            JSON.stringify(data.admin)
        );

        sessionStorage.setItem(
            "adminSessionToken",
            data.sessionToken
        );

        // ========================================
        // GO TO ADMIN DASHBOARD
        // ========================================

        window.location.href = "/admin/dashboard.html";

    } catch (error) {

        console.error("Admin login error:", error);

        alert(
            "Unable to connect to the server. " +
            "Please make sure the server is running."
        );
    }
});