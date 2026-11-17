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
// SECUREVAULT - MY FILES
// =========================================

const API_URL = "http://127.0.0.1:5000/api/files";


// =========================================
// ELEMENTS
// =========================================

const filesList = document.getElementById("filesList");
const emptyState = document.getElementById("emptyState");
const fileCount = document.getElementById("fileCount");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userAvatar = document.getElementById("userAvatar");


// Store files received from backend
let allFiles = [];


// =========================================
// GET TOKEN
// =========================================

const token = localStorage.getItem("token");


// =========================================
// AUTH CHECK
// =========================================

if (!token) {

    window.location.href = "login.html";

}


// =========================================
// LOAD FILES
// =========================================

async function loadFiles() {

    try {

        showLoading();

        const response = await authFetch(API_URL, {

            method: "GET",
        });


        const data = await response.json();


        console.log("Files API Response:", data);


        // =====================================
        // TOKEN EXPIRED / INVALID
        // =====================================

        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href = "login.html";

            return;

        }


        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load files."
            );

        }


        // =====================================
        // SAVE FILES
        // =====================================

        allFiles = data.files || [];


        // =====================================
        // UPDATE COUNT
        // =====================================

        fileCount.textContent = allFiles.length;


        // =====================================
        // DISPLAY FILES
        // =====================================

        displayFiles(allFiles);


    } catch (error) {

        console.error("Load Files Error:", error);

        showError(
            "Unable to connect to SecureVault server."
        );

    }

}


// =========================================
// DISPLAY FILES
// =========================================

function displayFiles(files) {

    filesList.innerHTML = "";


    // =====================================
    // EMPTY
    // =====================================

    if (files.length === 0) {

        filesList.style.display = "none";

        emptyState.style.display = "flex";

        return;

    }


    filesList.style.display = "flex";

    emptyState.style.display = "none";


    // =====================================
    // CREATE FILE CARDS
    // =====================================

    files.forEach(file => {

        const fileItem = document.createElement("div");

        fileItem.className = "file-item";


        // File icon
        const icon = getFileIcon(file.originalname);


        // File date
        const date = formatDate(
            file.created_at || file.uploaded_at
        );


        fileItem.innerHTML = `

            <div class="file-icon">
                ${icon}
            </div>


            <div class="file-info">

                <strong title="${escapeHTML(file.originalname)}">
                    ${escapeHTML(file.originalname)}
                </strong>

                <small>
                    Uploaded ${date}
                </small>

            </div>


            <div class="file-actions">

                <button
                    class="file-action-btn"
                    title="Download File"
                    onclick="downloadFile(${file.id})"
                    aria-label="Download File"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M12 4v11"></path>
                        <path d="m7 11 5 5 5-5"></path>
                        <path d="M5 20h14"></path>
                    </svg>
                </button>

                <button
                    class="file-action-btn"
                    title="Share File"
                    onclick="shareFile(${file.id})"
                    aria-label="Share File"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        
                        <path d="m8.6 13.5 6.8 4"></path>
                        <path d="m15.4 6.5-6.8 4"></path>
                    </svg>
                </button>

                <button
                    class="file-action-btn"
                    title="Delete File"
                    onclick="deleteFile(${file.id})"
                    aria-label="Delete File"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M3 6h18"></path>
                        <path d="M8 6V4h8v2"></path>
                        <path d="M19 6l-1 15H6L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                    </svg>
                </button>

            </div>

        `;


        filesList.appendChild(fileItem);

    });

}


// =========================================
// FILE ICON
// =========================================

function getFileIcon(fileName) {

    const extension =
        fileName.split(".").pop().toLowerCase();


    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "gif" ||
        extension === "webp"
    ) {

        return "🖼️";

    }


    if (
        extension === "pdf"
    ) {

        return "📕";

    }


    if (
        extension === "doc" ||
        extension === "docx"
    ) {

        return "📘";

    }


    if (
        extension === "xls" ||
        extension === "xlsx"
    ) {

        return "📊";

    }


    if (
        extension === "zip" ||
        extension === "rar" ||
        extension === "7z"
    ) {

        return "🗜️";

    }


    if (
        extension === "mp4" ||
        extension === "mkv" ||
        extension === "avi"
    ) {

        return "🎬";

    }


    if (
        extension === "mp3" ||
        extension === "wav"
    ) {

        return "🎵";

    }


    if (
        extension === "txt"
    ) {

        return "📄";

    }


    return "📁";

}


// =========================================
// DOWNLOAD FILE
// =========================================

async function downloadFile(fileId) {

    try {

        const response = await authFetch(
            `${API_URL}/${fileId}/download`,
            {
                method: "GET",
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href = "login.html";

            return;

        }


        if (!response.ok) {

            let errorMessage =
                "Unable to download file.";

            try {

                const data =
                    await response.json();

                errorMessage =
                    data.message || errorMessage;

            } catch (error) {

                // Response wasn't JSON

            }


            throw new Error(errorMessage);

        }


        // =====================================
        // GET FILE BLOB
        // =====================================

        const blob =
            await response.blob();


        const downloadUrl =
            window.URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = downloadUrl;


        // Try to get filename from backend
        const contentDisposition =
            response.headers.get(
                "Content-Disposition"
            );


        let fileName =
            getFileNameById(fileId);


        if (contentDisposition) {

            const match =
                contentDisposition.match(
                    /filename="?([^"]+)"?/i
                );


            if (match) {

                fileName =
                    decodeURIComponent(match[1]);

            }

        }


        link.download = fileName;


        document.body.appendChild(link);

        link.click();

        link.remove();


        window.URL.revokeObjectURL(
            downloadUrl
        );


    } catch (error) {

        console.error(
            "Download Error:",
            error
        );

        alert(
            error.message ||
            "Unable to download file."
        );

    }

}


// =========================================
// GET FILE NAME
// =========================================

function getFileNameById(fileId) {

    const file =
        allFiles.find(
            item => item.id === fileId
        );


    if (file) {

        return file.originalname;

    }


    return "SecureVault-File";

}


// =========================================
// DELETE FILE
// =========================================

async function deleteFile(fileId) {

    const file =
        allFiles.find(
            item => item.id === fileId
        );


    const fileName =
        file
            ? file.originalname
            : "this file";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${fileName}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =await authFetch(`${API_URL}/${fileId}`,
                {
                    method: "DELETE",
                }
            );


        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to delete file."
            );

        }


        alert(
            data.message ||
            "File deleted successfully."
        );


        // Reload files
        loadFiles();


    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete file."
        );

    }

}


// =========================================
// SEARCH FILES
// =========================================

searchInput.addEventListener(
    "input",
    () => {

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!searchTerm) {

            displayFiles(allFiles);

            return;

        }


        const filteredFiles =
            allFiles.filter(file => {

                return file.originalname
                    .toLowerCase()
                    .includes(searchTerm);

            });


        displayFiles(filteredFiles);

    }
);


// =========================================
// REFRESH
// =========================================

refreshBtn.addEventListener(
    "click",
    async () => {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "⏳ Loading...";


        await loadFiles();


        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "🔄 Refresh";

    }
);


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    performLogout
);


// =========================================
// LOADING STATE
// =========================================

function showLoading() {

    filesList.style.display = "flex";

    emptyState.style.display = "none";


    filesList.innerHTML = `

        <div class="files-loading">

            <div>
                🔐
            </div>

            <p>
                Loading your files...
            </p>

        </div>

    `;

}


// =========================================
// ERROR STATE
// =========================================

function showError(message) {

    filesList.style.display = "flex";

    emptyState.style.display = "none";


    filesList.innerHTML = `

        <div class="files-loading">

            <div>
                ⚠️
            </div>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}


// =========================================
// DATE FORMAT
// =========================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "Unknown date";

    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {

        return "Unknown date";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}

function shareFile(fileId) {

    console.log("Share clicked:", fileId);

    window.location.href =
        `create-share.html?fileId=${fileId}`;

}


// =========================================
// LOAD FILES ON PAGE LOAD
// =========================================

loadFiles();