// ========================================
// ADMIN FORGOT PASSWORD
// ========================================

const form =
    document.querySelector(
        "#admin-forgot-password-form"
    );

const emailInput =
    document.querySelector("#email");

const message =
    document.querySelector("#forgot-message");


form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        message.textContent = "";
        message.style.color = "";


        const email =
            emailInput.value.trim();


        // ========================================
        // VALIDATE EMAIL
        // ========================================

        if (!email) {

            message.textContent =
                "Please enter your admin email.";

            message.style.color =
                "red";

            return;
        }


        // ========================================
        // SEND REQUEST
        // ========================================

        try {

            const response =
                await fetch(
                    "/api/admin/auth/forgot-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email: email
                            })
                    }
                );


            const data =
                await response.json();


            // ========================================
            // SHOW RESPONSE
            // ========================================

            message.textContent =
                data.message ||
                "If an administrator account exists for this email, password reset instructions will be provided.";

            message.style.color =
                "green";

            form.reset();


        } catch (error) {

            console.error(
                "Admin forgot password error:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";

            message.style.color =
                "red";

        }

    }
);