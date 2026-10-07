// ========================================
// ADMIN PAGE PROTECTION
// ========================================

async function verifyAdminSession() {

    const sessionToken =
        sessionStorage.getItem(
            "adminSessionToken"
        );


    // No session token means the user
    // is not logged in.
    if (!sessionToken) {

        redirectToAdminLogin();

        return false;

    }


    try {

        const response =
            await fetch(
                "/api/admin/session",
                {
                    method: "GET",

                    headers: {
                        "x-admin-session-token":
                            sessionToken
                    }
                }
            );


        if (!response.ok) {

            sessionStorage.removeItem(
                "admin"
            );

            sessionStorage.removeItem(
                "adminSessionToken"
            );

            redirectToAdminLogin();

            return false;

        }


        const data =
            await response.json();


        // Refresh the stored admin information
        // from the server's verified information.
        sessionStorage.setItem(
            "admin",
            JSON.stringify(data.admin)
        );


        return true;


    } catch (error) {

        console.error(
            "Admin session verification failed:",
            error
        );

        alert(
            "Unable to verify your admin session."
        );

        return false;

    }

}


// ========================================
// REDIRECT TO LOGIN
// ========================================

function redirectToAdminLogin() {

    window.location.href =
        "/admin/login.html";

}


// ========================================
// START VERIFICATION
// ========================================

verifyAdminSession();

// ========================================
// ADMIN LOGOUT
// ========================================

const logoutButton =
    document.querySelector("#admin-logout");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            sessionStorage.removeItem("admin");
            sessionStorage.removeItem("adminSessionToken");

            window.location.href =
                "/admin/login.html";
        }
    );
}