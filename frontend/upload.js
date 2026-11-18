// =========================================
// SECUREVAULT - UPLOAD
// =========================================

const API_URL = "/api/files";


// =========================================
// ELEMENTS
// =========================================

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const selectedFileCard =
    document.getElementById("selectedFileCard");

const selectedFileName =
    document.getElementById("selectedFileName");

const selectedFileSize =
    document.getElementById("selectedFileSize");

const removeFileBtn =
    document.getElementById("removeFileBtn");

const uploadBtn =
    document.getElementById("uploadBtn");

const uploadMessage =
    document.getElementById("uploadMessage");

const progressContainer =
    document.getElementById("uploadProgressContainer");

const progressFill =
    document.getElementById("uploadProgressFill");

const progressText =
    document.getElementById("uploadProgressText");

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
// SELECTED FILE
// =========================================

let selectedFile = null;


// =========================================
// FILE INPUT
// =========================================

fileInput.addEventListener(
    "change",
    () => {

        if (!fileInput.files.length) {

            return;

        }

        handleFile(
            fileInput.files[0]
        );

    }
);


// =========================================
// HANDLE FILE
// =========================================

function handleFile(file) {

    selectedFile = file;

    selectedFileName.textContent =
        file.name;

    selectedFileSize.textContent =
        formatFileSize(file.size);

    selectedFileCard.style.display =
        "flex";

    uploadBtn.disabled =
        false;

    uploadMessage.textContent =
        "";

    uploadMessage.className =
        "upload-message";

}


// =========================================
// REMOVE FILE
// =========================================

removeFileBtn.addEventListener(
    "click",
    () => {

        selectedFile = null;

        fileInput.value = "";

        selectedFileCard.style.display =
            "none";

        uploadBtn.disabled =
            true;

        resetProgress();

        uploadMessage.textContent =
            "";

        uploadMessage.className =
            "upload-message";

    }
);


// =========================================
// DRAG & DROP
// =========================================

dropZone.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        dropZone.classList.add(
            "drag-over"
        );

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove(
            "drag-over"
        );

    }
);


dropZone.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        dropZone.classList.remove(
            "drag-over"
        );


        const files =
            event.dataTransfer.files;


        if (!files.length) {

            return;

        }


        handleFile(
            files[0]
        );

    }
);


// =========================================
// UPLOAD
// =========================================

uploadBtn.addEventListener(
    "click",
    uploadFile
);


function uploadFile() {

    if (!selectedFile) {

        showMessage(
            "Please select a file first.",
            "error"
        );

        return;

    }


    const formData =
        new FormData();


    formData.append(
        "file",
        selectedFile
    );


    uploadBtn.disabled =
        true;

    uploadBtn.textContent =
        "⏳ Uploading...";


    progressContainer.style.display =
        "block";

    setProgress(0);


    const xhr =
        new XMLHttpRequest();


    // =====================================
    // REQUEST
    // =====================================

    xhr.open(
        "POST",
        API_URL + "/upload",
        true
    );


    // =====================================
    // AUTHORIZATION
    // =====================================

    xhr.setRequestHeader(
        "Authorization",
        `Bearer ${token}`
    );


    // =====================================
    // UPLOAD PROGRESS
    // =====================================

    xhr.upload.addEventListener(
        "progress",
        (event) => {

            if (!event.lengthComputable) {

                return;

            }


            const percentage =
                Math.round(
                    (event.loaded /
                        event.total) *
                    100
                );


            setProgress(
                percentage
            );

        }
    );


    // =====================================
    // SUCCESS / RESPONSE
    // =====================================

    xhr.addEventListener(
        "load",
        () => {

            let data = {};

            try {

                data =
                    JSON.parse(
                        xhr.responseText
                    );

            } catch (error) {

                console.error(
                    "Invalid server response:",
                    xhr.responseText
                );

            }


            // =============================
            // TOKEN EXPIRED
            // =============================

            if (
                xhr.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                window.location.href =
                    "login.html";

                return;

            }


            // =============================
            // SUCCESS
            // =============================

            if (
                xhr.status >= 200 &&
                xhr.status < 300
            ) {

                setProgress(100);


                showMessage(
                    data.message ||
                    "File uploaded successfully! 🎉",
                    "success"
                );


                uploadBtn.textContent =
                    "✅ Upload Successful";


                // Reset after short delay
                setTimeout(
                    () => {

                        selectedFile = null;

                        fileInput.value = "";

                        selectedFileCard.style.display =
                            "none";

                        progressContainer.style.display =
                            "none";

                        uploadBtn.disabled =
                            true;

                        uploadBtn.textContent =
                            "🔐 Upload Securely";

                    },
                    1800
                );


                return;

            }


            // =============================
            // ERROR
            // =============================

            showMessage(
                data.message ||
                "Unable to upload file.",
                "error"
            );


            uploadBtn.disabled =
                false;

            uploadBtn.textContent =
                "🔐 Upload Securely";


            progressContainer.style.display =
                "none";

        }
    );


    // =====================================
    // NETWORK ERROR
    // =====================================

    xhr.addEventListener(
        "error",
        () => {

            console.error(
                "Upload request failed."
            );


            showMessage(
                "Unable to connect to SecureVault server.",
                "error"
            );


            uploadBtn.disabled =
                false;

            uploadBtn.textContent =
                "🔐 Upload Securely";


            progressContainer.style.display =
                "none";

        }
    );


    // =====================================
    // SEND
    // =====================================

    xhr.send(
        formData
    );

}


// =========================================
// PROGRESS
// =========================================

function setProgress(value) {

    progressFill.style.width =
        `${value}%`;

    progressText.textContent =
        `${value}%`;

}


// =========================================
// RESET PROGRESS
// =========================================

function resetProgress() {

    progressContainer.style.display =
        "none";

    progressFill.style.width =
        "0%";

    progressText.textContent =
        "0%";

}


// =========================================
// MESSAGE
// =========================================

function showMessage(
    message,
    type
) {

    uploadMessage.textContent =
        message;

    uploadMessage.className =
        `upload-message ${type}`;

}


// =========================================
// FILE SIZE
// =========================================

function formatFileSize(bytes) {

    if (bytes === 0) {

        return "0 Bytes";

    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );

}


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    performLogout
);
