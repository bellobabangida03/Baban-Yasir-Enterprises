// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPasswordForm =
    document.querySelector("#forgot-password-form");

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document
                    .querySelector("#email")
                    .value
                    .trim()
                    .toLowerCase();

            if (!email) {

                alert(
                    "Please enter your email address."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        "/api/auth/forgot-password",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );

                const data =
                    await response.json();

                alert(data.message);

            } catch (error) {

                console.error(
                    "Forgot password request failed:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }

        }
    );

}