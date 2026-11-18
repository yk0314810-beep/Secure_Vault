// =========================================
// SECUREVAULT DASHBOARD
// =========================================
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
// GET JWT TOKEN
// =========================================

const token = localStorage.getItem("token");
console.log("DASHBOARD TOKEN:", token);

// =========================================
// CHECK LOGIN
// =========================================

if (!token) {

    window.location.href = "login.html";

}


// =========================================
// ELEMENTS
// =========================================

const userNameElement =
    document.getElementById("userName");

const userAvatar =
    document.getElementById("userAvatar");

const totalFilesElement =
    document.getElementById("totalFiles");

const sharedFilesElement =
    document.getElementById("sharedFiles");

const expiringFilesElement =
    document.getElementById("expiringFiles");

const recentFilesElement =
    document.getElementById("recentFiles");

const logoutBtn =
    document.getElementById("logoutBtn");


// =========================================
// LOAD DASHBOARD
// =========================================

const loadDashboard = async () => {

    try {

        // =====================================
        // GET USER PROFILE
        // =====================================

        const profileResponse = await authFetch(
            "/api/auth/profile",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        // =====================================
        // TOKEN INVALID / EXPIRED
        // =====================================

        if (!profileResponse.ok) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const profileData =
            await profileResponse.json();


        // =====================================
        // USER INFORMATION
        // =====================================

        const user =
            profileData.user;

        const name =
            user.name || "User";


        userNameElement.textContent =
            name;


        userAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();


        // =====================================
        // GET MY FILES
        // =====================================

        const filesResponse = await authFetch(
            "/api/files/",
            {
                method: "GET",
            }
        );


        if (!filesResponse.ok) {

            throw new Error(
                "Unable to fetch files"
            );

        }


        const filesData =
            await filesResponse.json();


        // =====================================
        // FILES ARRAY
        // =====================================

        const files =
            filesData.files || [];


        // =====================================
        // TOTAL FILES
        // =====================================

        totalFilesElement.textContent =
            files.length;


        // =====================================
        // RECENT FILES
        // =====================================

        displayRecentFiles(files);


        // =====================================
        // GET SHARED FILES
        // =====================================

        const sharedResponse = await authFetch(
            "/api/files/shared",
            {
                method: "GET",
            }
        );


        if (!sharedResponse.ok) {

            throw new Error(
                "Unable to fetch shared files"
            );

        }


        const sharedData =
            await sharedResponse.json();0


        // =====================================
        // SHARES ARRAY
        // =====================================

        const shares =
            sharedData.shares || [];


        // =====================================
        // TOTAL SHARED FILES
        // =====================================

        sharedFilesElement.textContent =
            shares.length;


        // =====================================
        // EXPIRING SOON
        // =====================================

        const now =
            new Date();


        const sevenDaysFromNow =
            new Date(
                now.getTime() +
                7 * 24 * 60 * 60 * 1000
            );


        const expiringShares =
            shares.filter(share => {

                // No expiry
                if (!share.expires_at) {

                    return false;

                }


                const expiry =
                    new Date(
                        share.expires_at
                    );


                // Only active shares
                const isActive =
                    !share.status ||
                    share.status === "Active";


                return (
                    isActive &&
                    expiry > now &&
                    expiry <= sevenDaysFromNow
                );

            });


        expiringFilesElement.textContent =
            expiringShares.length;


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

};


// =========================================
// DISPLAY RECENT FILES
// =========================================

const displayRecentFiles = (files) => {

    // =====================================
    // EMPTY VAULT
    // =====================================

    if (!files || files.length === 0) {

        recentFilesElement.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📂
                </div>

                <h3>
                    Your vault is empty
                </h3>

                <p>
                    Upload your first file
                    to get started.
                </p>

                <a
                    href="index.html"
                    class="empty-action"
                >
                    Upload File
                </a>

            </div>

        `;

        return;

    }


    // =====================================
    // GET LATEST 5 FILES
    // =====================================

    const recentFiles =
        [...files]
            .reverse()
            .slice(0, 5);


    // =====================================
    // CREATE FILE CARDS
    // =====================================

    recentFilesElement.innerHTML =
        recentFiles.map(file => `

            <div class="recent-file">

                <div class="recent-file-icon">
                    📄
                </div>


                <div class="recent-file-info">

                    <strong
                        title="${escapeHtml(file.originalname)}"
                    >
                        ${escapeHtml(file.originalname)}
                    </strong>

                    <small>
                        ${formatDate(file.created_at)}
                    </small>

                </div>


                <button
                    class="recent-download"
                    data-file-id="${file.id}"
                    title="Download file"
                >
                    📥
                </button>

            </div>

        `).join("");
        

    // =====================================
    // DOWNLOAD BUTTONS
    // =====================================

    const downloadButtons =
        document.querySelectorAll(
            ".recent-download"
        );


    downloadButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                downloadDashboardFile(
                    button.dataset.fileId,
                    button
                );

            }
        );

    });

};


// =========================================
// DOWNLOAD DASHBOARD FILE
// =========================================

const downloadDashboardFile = async (
    fileId,
    button
) => {

    try {

        // =================================
        // BUTTON LOADING
        // =================================

        button.disabled = true;

        button.textContent = "⏳";


        // =================================
        // DOWNLOAD REQUEST
        // =================================

        const response = await authFetch(
            `/api/files/${fileId}/download`,
            {
                method: "GET",
            }
        );


        // =================================
        // DOWNLOAD FAILED
        // =================================

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
                    "Unable to read error response"
                );

            }


            alert(errorMessage);

            return;
        }


        // =================================
        // GET FILE BLOB
        // =================================

        const blob =
            await response.blob();


        // =================================
        // CREATE DOWNLOAD URL
        // =================================

        const downloadUrl =
            window.URL.createObjectURL(
                blob
            );


        // =================================
        // GET FILE NAME
        // =================================

        const fileCard =
            button.closest(
                ".recent-file"
            );


        const fileNameElement =
            fileCard.querySelector(
                ".recent-file-info strong"
            );


        const fileName =
            fileNameElement
                .getAttribute("title");


        // =================================
        // CREATE DOWNLOAD LINK
        // =================================

        const link =
            document.createElement("a");


        link.href =
            downloadUrl;


        link.download =
            fileName || "download";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        // =================================
        // CLEAN URL
        // =================================

        window.URL.revokeObjectURL(
            downloadUrl
        );


    } catch (error) {

        console.error(
            "Download Error:",
            error
        );


        alert(
            "Unable to download file."
        );


    } finally {

        // =================================
        // RESET BUTTON
        // =================================

        button.disabled = false;

        button.textContent = "📥";

    }

};


// =========================================
// FORMAT DATE
// =========================================

const formatDate = (date) => {

    if (!date) {

        return "Unknown date";

    }


    return new Date(date)
        .toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

};


// =========================================
// ESCAPE HTML
// =========================================

const escapeHtml = (text) => {

    if (!text) {

        return "";

    }


    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

};


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    performLogout
);


// =========================================
// START DASHBOARD
// =========================================

loadDashboard();