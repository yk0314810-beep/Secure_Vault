const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const messageElement = document.getElementById("message");
const rememberDeviceInput =
    document.getElementById("rememberDevice");


// ===============================
// LOGIN
// ===============================

loginBtn.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();


    // ===============================
    // VALIDATION
    // ===============================

    if (!email || !password) {

        messageElement.textContent =
            "Email and password are required.";

        return;
    }


    try {

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";


        // ===============================
        // LOGIN API
        // ===============================

        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    email: email,
                    password: password,
                    rememberDevice: rememberDeviceInput.checked
                })
            }
        );


        const data =
            await response.json();


        // ===============================
        // LOGIN FAILED
        // ===============================

        if (!response.ok) {

            messageElement.textContent =
                data.message || "Login failed.";

            loginBtn.disabled = false;
            loginBtn.textContent = "Login 🔐";

            return;
        }


        // ===============================
        // SAVE JWT
        // ===============================

        localStorage.setItem(
            "token",
            data.token
        );


        messageElement.textContent =
            "Login Successful 🚀";


        // ===============================
        // GO TO DASHBOARD
        // ===============================

        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 500);


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        messageElement.textContent =
            "Unable to connect to SecureVault server.";

        loginBtn.disabled = false;
        loginBtn.textContent =
            "Login 🔐";
    }

});

// ===============================
// AUTO LOGIN WITH REMEMBERED DEVICE
// ===============================

async function checkRememberedDevice() {

    try {

        const response = await fetch(
            "/api/auth/remember-login",
            {
                method: "POST",
                credentials: "include"
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            return;
        }

        if (data.success && data.token) {

            localStorage.setItem(
                "token",
                data.token
            );

            window.location.href =
                "dashboard.html";
        }

    } catch (error) {

        console.log(
            "Remembered Device Check:",
            error
        );

    }

}


// ===============================
// CHECK ON PAGE LOAD
// ===============================

checkRememberedDevice();