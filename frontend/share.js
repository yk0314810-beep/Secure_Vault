
const API_URL = "";


// =========================================
// GET SHARE TOKEN
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const shareToken =
    params.get("token");


// =========================================
// DOM ELEMENTS
// =========================================

const fileNameElement =
    document.getElementById("fileName");

const passwordInput =
    document.getElementById("password");

const accessBtn =
    document.getElementById("accessBtn");

const messageElement =
    document.getElementById("message");


// =========================================
// STATE
// =========================================

let downloadToken = null;

let accessGranted = false;

let requestInProgress = false;


// =========================================
// CHECK SHARE TOKEN
// =========================================

if (!shareToken) {

    fileNameElement.textContent =
        "Invalid Share Link";

    messageElement.textContent =
        "This share link is invalid or incomplete.";

    accessBtn.disabled = true;

}


// =========================================
// PASSWORD SHOW / HIDE
// =========================================

const passwordWrapper =
    passwordInput?.parentElement;

if (passwordInput && passwordWrapper) {

    const toggleButton =
        document.createElement("button");

    toggleButton.type = "button";

    toggleButton.textContent = "👁️";

    toggleButton.title =
        "Show password";

    toggleButton.style.marginLeft =
        "8px";

    toggleButton.style.cursor =
        "pointer";

    toggleButton.addEventListener(
        "click",
        () => {

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";

                toggleButton.textContent =
                    "🙈";

                toggleButton.title =
                    "Hide password";

            } else {

                passwordInput.type =
                    "password";

                toggleButton.textContent =
                    "👁️";

                toggleButton.title =
                    "Show password";
            }

        }
    );

    passwordWrapper.appendChild(
        toggleButton
    );
}


// =========================================
// MESSAGE HELPER
// =========================================

function showMessage(message) {

    messageElement.textContent =
        message;
}


// =========================================
// BUTTON STATE
// =========================================

function setButton(
    text,
    disabled = false
) {

    accessBtn.textContent =
        text;

    accessBtn.disabled =
        disabled;
}


// =========================================
// ACCESS / DOWNLOAD
// =========================================

accessBtn.addEventListener(
    "click",
    async () => {

        if (
            requestInProgress ||
            !shareToken
        ) {

            return;
        }


        // =========================================
        // DOWNLOAD
        // =========================================

        if (accessGranted) {

            await downloadFile();

            return;
        }


        // =========================================
        // PASSWORD
        // =========================================

        const password =
            passwordInput.value.trim();


        if (!password) {

            showMessage(
                "Please enter the share password."
            );

            passwordInput.focus();

            return;
        }


        if (password.length < 1) {

            showMessage(
                "Please enter a valid password."
            );

            return;
        }


        // =========================================
        // ACCESS REQUEST
        // =========================================

        requestInProgress = true;

        setButton(
            "Checking...",
            true
        );

        showMessage(
            "Verifying password..."
        );


        try {

            const response =
                await fetch(
                    `${API_URL}/api/files/shared/${encodeURIComponent(
                        shareToken
                    )}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            password:
                                password
                        })
                    }
                );


            const data =
                await response.json();


            // =========================================
            // ERROR
            // =========================================

            if (!response.ok) {

                if (
                    response.status ===
                    410
                ) {

                    showMessage(
                        data.message ||
                        "This share link has expired or been revoked."
                    );

                    setButton(
                        "Access File 🔓",
                        true
                    );

                } else if (
                    response.status ===
                    401
                ) {

                    showMessage(
                        "Incorrect share password. Please try again."
                    );

                    setButton(
                        "Access File 🔓",
                        false
                    );

                    passwordInput.focus();

                } else {

                    showMessage(
                        data.message ||
                        "Unable to access this shared file."
                    );

                    setButton(
                        "Access File 🔓",
                        false
                    );
                }

                return;
            }


            // =========================================
            // ACCESS GRANTED
            // =========================================

            if (
                !data.file ||
                !data.downloadToken
            ) {

                showMessage(
                    "Invalid server response."
                );

                setButton(
                    "Access File 🔓",
                    false
                );

                return;
            }


            fileNameElement.textContent =
                data.file.originalname ||
                "Shared File";


            downloadToken =
                data.downloadToken;


            accessGranted =
                true;


            showMessage(
                "Access Granted 🔓 Your file is ready to download."
            );


            setButton(
                "Download File 📥",
                false
            );


            // Password no longer needs to remain editable

            passwordInput.disabled =
                true;


        } catch (error) {

            console.error(
                "Access Error:",
                error
            );


            showMessage(
                "Unable to connect to SecureVault server."
            );


            setButton(
                "Access File 🔓",
                false
            );

        } finally {

            requestInProgress =
                false;
        }

    }
);


// =========================================
// DOWNLOAD FILE
// =========================================

async function downloadFile() {

    if (
        !downloadToken ||
        !accessGranted
    ) {

        return;
    }


    const password =
        passwordInput.value.trim();


    if (!password) {

        showMessage(
            "Password is required for download."
        );

        return;
    }


    requestInProgress =
        true;


    setButton(
        "Downloading...",
        true
    );


    showMessage(
        "Preparing your secure download..."
    );


    try {

        const response =
            await fetch(
                `${API_URL}/api/files/shared/${encodeURIComponent(
                    downloadToken
                )}/download`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        password:
                            password
                    })
                }
            );


        // =========================================
        // DOWNLOAD ERROR
        // =========================================

        if (!response.ok) {

            let errorMessage =
                "Download failed.";


            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.message ||
                    errorMessage;

            } catch (error) {

                console.log(
                    "Download error response was not JSON."
                );
            }


            if (
                response.status ===
                410
            ) {

                showMessage(
                    errorMessage ||
                    "This share link has expired or been revoked."
                );

                accessGranted =
                    false;

                downloadToken =
                    null;

                passwordInput.disabled =
                    false;

                setButton(
                    "Access File 🔓",
                    true
                );

            } else {

                showMessage(
                    errorMessage
                );

                setButton(
                    "Download File 📥",
                    false
                );
            }

            return;
        }


        // =========================================
        // CREATE FILE BLOB
        // =========================================

        const blob =
            await response.blob();


        const downloadUrl =
            window.URL.createObjectURL(
                blob
            );


        const link =
            document.createElement("a");


        link.href =
            downloadUrl;


        link.download =
            fileNameElement.textContent ||
            "SecureVault-File";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.URL.revokeObjectURL(
            downloadUrl
        );


        // =========================================
        // SUCCESS
        // =========================================

        showMessage(
            "File Downloaded Successfully 📥"
        );


        setButton(
            "Download Again 📥",
            false
        );


    } catch (error) {

        console.error(
            "Download Error:",
            error
        );


        showMessage(
            "Unable to download file. Please try again."
        );


        setButton(
            "Download File 📥",
            false
        );

    } finally {

        requestInProgress =
            false;
    }
}


// =========================================
// ENTER KEY SUPPORT
// =========================================

passwordInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Enter"
        ) {

            accessBtn.click();
        }

    }
);
