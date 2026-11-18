// =========================================
// SECUREVAULT GLOBAL LOGOUT
// =========================================

async function performLogout() {

    try {

        // =========================================
        // CALL BACKEND LOGOUT
        // =========================================

        await fetch(
            "/api/auth/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    } finally {

        // =========================================
        // REMOVE JWT
        // =========================================

        localStorage.removeItem("token");


        // =========================================
        // NOTIFY OTHER OPEN TABS
        // =========================================

        localStorage.setItem(
            "secureVaultLogout",
            Date.now().toString()
        );   


        // =========================================
        // REDIRECT
        // =========================================

        window.location.href =
            "login.html";

    }

}


// =========================================
// GLOBAL LOGOUT LISTENER
// =========================================

window.addEventListener(
    "storage",
    (event) => {

        if (
            event.key === "secureVaultLogout"
        ) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

        }

    }
);

// =========================================
// PROTECTED PAGE GUARD
// =========================================

function requireAuth() {

    const token = localStorage.getItem("token");

    if (!token) {

        window.location.replace("login.html");

        return false;
    }

    return true;
}

// =========================================
// AUTHENTICATED API REQUEST
// =========================================

async function authFetch(url, options = {}) {

    const token =
        localStorage.getItem("token");

    console.log("AUTH TOKEN:", token);

    if (!token) {

        window.location.replace(
            "login.html"
        );

        return null;
    }


    const response = await fetch(
        url,
        {
            ...options,

            headers: {
                ...(options.headers || {}),

                "Authorization":
                    `Bearer ${token}`
            }
        }
    );
    console.log("AUTH FETCH STATUS:", response.status);
    console.log("AUTH FETCH URL:", url);

    // =========================================
    // SESSION EXPIRED / INVALID
    // =========================================

    if (response.status === 401) {

        localStorage.removeItem(
            "token"
        );

        localStorage.setItem(
            "secureVaultLogout",
            Date.now().toString()
        );

        window.location.replace(
            "login.html"
        );

        return null;
    }


    return response;
}