// =========================================
// PROTECTED PAGE CHECK
// =========================================

if (!requireAuth()) {
    throw new Error("User is not authenticated");
}

window.addEventListener("pageshow", () => {

    if (!localStorage.getItem("token")) {

        window.location.replace("login.html");

    }

});


requireAuth();

// =========================================
// SECUREVAULT - CREATE SHARE
// =========================================

const API_URL = "http://127.0.0.1:5000/api/files";
const AUTH_API_URL = "http://127.0.0.1:5000/api/auth";


// =========================================
// URL PARAMETERS
// =========================================

const params = new URLSearchParams(
    window.location.search
);

const selectedFileId = params.get("fileId");


// =========================================
// ELEMENTS
// =========================================

const fileSelect =
    document.getElementById("fileSelect");

const recipientEmail =
    document.getElementById("recipientEmail");

const sharePassword =
    document.getElementById("sharePassword");

const expiry =
    document.getElementById("expiry");

const maxDownloads =
    document.getElementById("maxDownloads");

const generateShareBtn =
    document.getElementById("generateShareBtn");

const shareMessage =
    document.getElementById("shareMessage");

const shareResult =
    document.getElementById("shareResult");

const shareLink =
    document.getElementById("shareLink");

const copyShareBtn =
    document.getElementById("copyShareBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const userAvatar =
    document.getElementById("userAvatar");


// =========================================
// TOKEN
// =========================================

const token =
    localStorage.getItem("token");


// =========================================
// AUTH CHECK
// =========================================

if (!token) {

    window.location.href = "login.html";

}


// =========================================
// HELPER - API JSON
// =========================================

async function getResponseData(response) {

    try {

        return await response.json();

    } catch {

        return {};

    }

}


// =========================================
// LOAD USER FILES
// =========================================

async function loadFiles() {

    try {

        fileSelect.innerHTML = `
            <option value="">
                Loading your files...
            </option>
        `;

        fileSelect.disabled = true;

        const response = await authFetch(
            API_URL,
            {
                method: "GET",
            }
        );


        // =================================
        // UNAUTHORIZED
        // =================================

        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await getResponseData(response);


        // =================================
        // API ERROR
        // =================================

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load files."
            );

        }


        const files =
            Array.isArray(data.files)
                ? data.files
                : [];


        // =================================
        // CLEAR DROPDOWN
        // =================================

        fileSelect.innerHTML = "";


        // =================================
        // NO FILES
        // =================================

        if (files.length === 0) {

            const option =
                document.createElement("option");

            option.value = "";

            option.textContent =
                "No files available";

            fileSelect.appendChild(option);

            fileSelect.disabled = true;

            generateShareBtn.disabled = true;

            return;

        }


        // =================================
        // DEFAULT OPTION
        // =================================

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            "Select a file";

        fileSelect.appendChild(
            defaultOption
        );


        // =================================
        // ADD FILES
        // =================================

        files.forEach(file => {

            const option =
                document.createElement("option");

            option.value = file.id;

            option.textContent =
                file.originalname ||
                `File ${file.id}`;

            fileSelect.appendChild(option);

        });


        fileSelect.disabled = false;

        generateShareBtn.disabled = false;


        // =================================
        // AUTO SELECT FILE
        // =================================

        if (selectedFileId) {

            const matchingFile =
                files.find(
                    file =>
                        String(file.id) ===
                        String(selectedFileId)
                );


            if (matchingFile) {

                fileSelect.value =
                    String(selectedFileId);

            }

        }

    } catch (error) {

        console.error(
            "Load Files Error:",
            error
        );


        fileSelect.innerHTML = `
            <option value="">
                Unable to load files
            </option>
        `;

        fileSelect.disabled = true;

        generateShareBtn.disabled = true;

        showMessage(
            "Unable to load your files.",
            "error"
        );

    }

}


// =========================================
// GENERATE SHARE
// =========================================

generateShareBtn.addEventListener(
    "click",
    async () => {

        const fileId =
            fileSelect.value;

        const email =
            recipientEmail.value.trim();

        const password =
            sharePassword.value.trim();

        const selectedExpiry =
            expiry.value;

        const selectedLimit =
            maxDownloads.value;


        // =================================
        // CLEAR OLD RESULT
        // =================================

        shareResult.style.display =
            "none";


        // =================================
        // VALIDATION
        // =================================

        if (!fileId) {

            showMessage(
                "Please select a file.",
                "error"
            );

            fileSelect.focus();

            return;

        }


        if (!email) {

            showMessage(
                "Please enter recipient email.",
                "error"
            );

            recipientEmail.focus();

            return;

        }


        // =================================
        // EMAIL VALIDATION
        // =================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            showMessage(
                "Please enter a valid email address.",
                "error"
            );

            recipientEmail.focus();

            return;

        }


        if (!password) {

            showMessage(
                "Please create a share password.",
                "error"
            );

            sharePassword.focus();

            return;

        }


        if (password.length < 6) {

            showMessage(
                "Share password must be at least 6 characters.",
                "error"
            );

            sharePassword.focus();

            return;

        }


        // =================================
        // EXPIRY
        // =================================

        const expiryValue =
            selectedExpiry || null;


        // =================================
        // LOADING STATE
        // =================================

        generateShareBtn.disabled =
            true;

        generateShareBtn.innerHTML =
            "⏳ Creating secure link...";

        generateShareBtn.style.cursor =
            "wait";


        showMessage(
            "Securing your file...",
            "loading"
        );


        try {

            // =================================
            // CREATE SHARE
            // =================================

            const response =
                await authFetch(
                    `${API_URL}/share`,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                        },

                        body: JSON.stringify({

                            fileId:
                                fileId,

                            recipientEmail:
                                email,

                            password:
                                password,

                            expiry:
                                expiryValue,

                            maxDownloads:
                                selectedLimit || null

                        })
                    }
                );


            const data =
                await getResponseData(response);


            // =================================
            // AUTH ERROR
            // =================================

            if (response.status === 401) {

                localStorage.removeItem(
                    "token"
                );

                window.location.href =
                    "login.html";

                return;

            }


            // =================================
            // API ERROR
            // =================================

            if (!response.ok) {

                showMessage(
                    data.message ||
                    "Unable to create share.",
                    "error"
                );

                return;

            }


            // =================================
            // GET SHARE TOKEN
            // =================================

            const tokenValue =
                data.shareToken;


            if (!tokenValue) {

                showMessage(
                    "Share created, but no share token was returned.",
                    "error"
                );

                return;

            }


            // =================================
            // CREATE FRONTEND SHARE LINK
            // =================================

            const frontendUrl =
                `${window.location.origin}` +
                `/frontend/share.html?token=` +
                encodeURIComponent(tokenValue);


            // =================================
            // DISPLAY LINK
            // =================================

            shareLink.value =
                frontendUrl;


            shareResult.style.display =
                "block";


            // =================================
            // SUCCESS MESSAGE
            // =================================

            showMessage(
                "File shared successfully 🔐",
                "success"
            );


            // =================================
            // SCROLL TO RESULT
            // =================================

            setTimeout(() => {

                shareResult.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }, 100);


        } catch (error) {

            console.error(
                "Create Share Error:",
                error
            );


            showMessage(
                "Unable to connect to SecureVault server.",
                "error"
            );

        } finally {

            generateShareBtn.disabled =
                false;

            generateShareBtn.innerHTML =
                "🔗 Generate Secure Link";

            generateShareBtn.style.cursor =
                "pointer";

        }

    }
);


// =========================================
// COPY SHARE LINK
// =========================================

copyShareBtn.addEventListener(
    "click",
    async () => {

        const link =
            shareLink.value.trim();


        if (!link) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                link
            );


            copyShareBtn.innerHTML =
                "✅ Copied!";


            copyShareBtn.disabled =
                true;


            setTimeout(() => {

                copyShareBtn.innerHTML =
                    "📋 Copy";

                copyShareBtn.disabled =
                    false;

            }, 1800);


        } catch (error) {

            // =================================
            // FALLBACK COPY
            // =================================

            shareLink.focus();

            shareLink.select();

            shareLink.setSelectionRange(
                0,
                99999
            );


            try {

                document.execCommand("copy");

                copyShareBtn.innerHTML =
                    "✅ Copied!";

            } catch {

                copyShareBtn.innerHTML =
                    "❌ Copy Failed";

            }


            setTimeout(() => {

                copyShareBtn.innerHTML =
                    "📋 Copy";

            }, 1800);

        }

    }
);


// =========================================
// SHOW MESSAGE
// =========================================

function showMessage(
    message,
    type
) {

    shareMessage.textContent =
        message;

    shareMessage.className =
        `upload-message ${type}`;

}


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    performLogout
);


// =========================================
// LOAD USER PROFILE
// =========================================

async function loadProfile() {

    try {

        const response =
            await authFetch(
                `${AUTH_API_URL}/profile`,
                {
                    method: "GET",
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;

        }


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        if (
            data.user &&
            data.user.name &&
            userAvatar
        ) {

            userAvatar.textContent =
                data.user.name
                    .charAt(0)
                    .toUpperCase();

        }

    } catch (error) {

        console.error(
            "Profile Error:",
            error
        );

    }

}


// =========================================
// START APPLICATION
// =========================================

loadFiles();

loadProfile();