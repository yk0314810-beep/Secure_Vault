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

const API_URL = "";

const sharedFilesContainer =
    document.getElementById("sharedFiles");

const logoutBtn =
    document.getElementById("logoutBtn");

// =========================================
// GET TOKEN
// =========================================

const token =
    localStorage.getItem("token");


// =========================================
// CHECK LOGIN
// =========================================

if (!token) {

    sharedFilesContainer.innerHTML = `
        <div class="shared-empty">

            <div class="shared-empty-icon">
                🔐
            </div>

            <h2>
                Login Required
            </h2>

            <p>
                Please login first to view your shared files.
            </p>

        </div>
    `;

} else {

    loadSharedFiles();

}


// =========================================
// LOAD SHARED FILES
// =========================================

async function loadSharedFiles() {

    try {

        sharedFilesContainer.innerHTML = `
            <div class="shared-loading">

                <div class="loading-icon">
                    🔐
                </div>

                <p>
                    Loading shared files...
                </p>

            </div>
        `;


        const response =
            await authFetch(
                `${API_URL}/api/files/shared`,
                {
                    method: "GET",
                }
            );


        // =========================================
        // AUTH ERROR
        // =========================================

        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            sharedFilesContainer.innerHTML = `
                <div class="shared-empty">

                    <div class="shared-empty-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to Load
                    </h2>

                    <p>
                        ${
                            escapeHTML(
                                data.message ||
                                "Unable to load shared files."
                            )
                        }
                    </p>

                </div>
            `;

            return;
        }


        const shares =
            data.shares || [];


        // =========================================
        // UPDATE STATISTICS
        // =========================================

        updateShareStats(shares);


        // =========================================
        // NO SHARES
        // =========================================

        if (shares.length === 0) {

            sharedFilesContainer.innerHTML = `
                <div class="shared-empty">

                    <div class="shared-empty-icon">
                        🔗
                    </div>

                    <h2>
                        No Shared Files
                    </h2>

                    <p>
                        You haven't shared any files yet.
                    </p>

                    <a
                        href="create-share.html"
                        class="shared-empty-btn"
                    >
                        🔗 Share a File
                    </a>

                </div>
            `;

            return;
        }


        // =========================================
        // DISPLAY SHARES
        // =========================================

        sharedFilesContainer.innerHTML = "";


        shares.forEach((share) => {

            const card =
                createShareCard(share);

            sharedFilesContainer.appendChild(card);

        });


        // =========================================
        // SETUP SEARCH
        // =========================================

        setupSearch(shares);


    } catch (error) {

        console.error(
            "Load Shared Files Error:",
            error
        );


        sharedFilesContainer.innerHTML = `
            <div class="shared-empty">

                <div class="shared-empty-icon">
                    ⚠️
                </div>

                <h2>
                    Connection Error
                </h2>

                <p>
                    Unable to connect to SecureVault server.
                </p>

            </div>
        `;
    }
}


// =========================================
// CREATE SHARE CARD
// =========================================

function createShareCard(share) {

    const card =
        document.createElement("div");


    card.className =
        "premium-share-card";


    // =========================================
    // STATUS
    // =========================================

    const status =
        share.status || "Active";


    const isActive =
        status === "Active";


    const isRevoked =
        status === "Revoked";


    const isExpired =
        status === "Expired";


    let statusText =
        status;


    let statusClass =
        "status-active";


    if (isRevoked) {

        statusClass =
            "status-revoked";

    } else if (isExpired) {

        statusClass =
            "status-expired";

    }


    // =========================================
    // DATE
    // =========================================

    const createdDate =
        formatDate(
            share.created_at
        );


    const expiryDate =
        share.expires_at
            ? formatDate(
                share.expires_at
            )
            : "Never";


    // =========================================
    // EXPIRING SOON
    // =========================================

    const expiringSoon =
        isExpiringSoon(
            share.expires_at
        );


    // =========================================
    // SHARE TOKEN
    // =========================================

    const shareToken =
        share.token ||
        share.share_token ||
        share.shareToken ||
        "";


    // =========================================
    // SHARE LINK
    // =========================================

    let shareLink = "";

    if (shareToken) {

        shareLink =
            `${window.location.origin}/share.html?token=${encodeURIComponent(shareToken)}`;
}


    // =========================================
    // ACCESS COUNT
    // =========================================

    const accessCount =
        Number(
            share.access_count || 0
        );


    // =========================================
    // LAST ACCESSED
    // =========================================

    const lastAccessed =
        share.last_accessed_at
            ? formatDate(
                share.last_accessed_at
            )
            : "Never";


    // =========================================
    // CARD HTML
    // =========================================

    card.innerHTML = `

        <div class="premium-share-main">


            <!-- FILE ICON -->

            <div class="premium-share-icon">

                🔗

            </div>


            <!-- FILE INFORMATION -->

            <div class="premium-share-info">


                <!-- TITLE + STATUS -->

                <div class="premium-share-title-row">

                    <h3>
                        ${escapeHTML(
                            share.originalname ||
                            "Shared File"
                        )}
                    </h3>


                    <span
                        class="share-status ${statusClass}"
                    >
                        ● ${escapeHTML(statusText)}
                    </span>

                </div>


                <!-- SUBTITLE -->

                <p class="share-subtitle">

                    Securely shared file

                </p>


                <!-- DETAILS -->

                <div class="share-details-grid">


                    <!-- RECIPIENT -->

                    <div class="share-detail">

                        <span class="detail-label">

                            RECIPIENT

                        </span>


                        <strong>

                            👤

                            ${escapeHTML(
                                share.recipient_email ||
                                "Unknown recipient"
                            )}

                        </strong>

                    </div>


                    <!-- CREATED -->

                    <div class="share-detail">

                        <span class="detail-label">

                            SHARED ON

                        </span>


                        <strong>

                            📅

                            ${createdDate}

                        </strong>

                    </div>


                    <!-- EXPIRES -->

                    <div class="share-detail">

                        <span class="detail-label">

                            EXPIRES

                        </span>


                        <strong>

                            ⏰

                            ${expiryDate}

                        </strong>

                    </div>


                    <!-- ACCESS COUNT -->

                    <div class="share-detail">

                        <span class="detail-label">

                            ACCESS COUNT

                        </span>


                        <strong>

                            👁️

                            ${accessCount}

                        </strong>

                    </div>


                    <!-- LAST ACCESSED -->

                    <div class="share-detail">

                        <span class="detail-label">

                            LAST ACCESSED

                        </span>


                        <strong>

                            🕐

                            ${lastAccessed}

                        </strong>

                    </div>


                </div>


                <!-- SECURITY BADGES -->

                <div class="share-security-row">


                    <span class="password-badge">

                        🔐 Password Protected

                    </span>


                    ${
                        expiringSoon && isActive
                            ? `
                                <span class="expiring-badge">

                                    ⚠️ Expiring Soon

                                </span>
                              `
                            : ""
                    }


                    ${
                        isRevoked
                            ? `
                                <span class="expiring-badge">

                                    🔒 Access Revoked

                                </span>
                              `
                            : ""
                    }


                </div>


            </div>


            <!-- ACTION BUTTONS -->

            <div class="premium-share-actions">


                ${
                    isActive && shareLink
                        ? `
                            <button
                                class="share-copy-btn"
                                title="Copy Share Link"
                                onclick="copyShareLink(
                                    '${escapeAttribute(shareLink)}',
                                    this
                                )"
                            >

                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >

                                    <rect
                                        x="9"
                                        y="9"
                                        width="13"
                                        height="13"
                                        rx="2"
                                    ></rect>

                                    <path
                                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                    ></path>

                                </svg>


                                <span>
                                    Copy Link
                                </span>

                            </button>
                          `
                        : ""
                }


                ${
                    isActive
                        ? `
                            <button
                                class="share-revoke-btn"
                                title="Revoke Share"
                                onclick="revokeShare(${Number(
                                    share.id
                                )})"
                            >

                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >

                                    <path
                                        d="M3 6h18"
                                    ></path>

                                    <path
                                        d="M8 6V4h8v2"
                                    ></path>

                                    <path
                                        d="M19 6l-1 15H6L5 6"
                                    ></path>

                                    <path
                                        d="M10 11v6"
                                    ></path>

                                    <path
                                        d="M14 11v6"
                                    ></path>

                                </svg>


                                <span>
                                    Revoke
                                </span>

                            </button>
                          `
                        : ""
                }


            </div>


        </div>

    `;


    return card;
}


// =========================================
// UPDATE STATISTICS
// =========================================

function updateShareStats(shares) {

    const total =
        shares.length;


    const active =
        shares.filter(
            share =>
                share.status === "Active"
        ).length;


    const revoked =
        shares.filter(
            share =>
                share.status === "Revoked"
        ).length;


    const expired =
        shares.filter(
            share =>
                share.status === "Expired"
        ).length;


    const expiring =
        shares.filter(
            share =>
                isExpiringSoon(
                    share.expires_at
                ) &&
                share.status === "Active"
        ).length;


    const totalElement =
        document.getElementById(
            "totalShares"
        );


    const activeElement =
        document.getElementById(
            "activeShares"
        );


    const expiringElement =
        document.getElementById(
            "expiringShares"
        );


    const revokedElement =
        document.getElementById(
            "revokedShares"
        );


    const expiredElement =
        document.getElementById(
            "expiredShares"
        );


    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (activeElement) {

        activeElement.textContent =
            active;
    }


    if (expiringElement) {

        expiringElement.textContent =
            expiring;
    }


    if (revokedElement) {

        revokedElement.textContent =
            revoked;
    }


    if (expiredElement) {

        expiredElement.textContent =
            expired;
    }
}


// =========================================
// CHECK EXPIRING SOON
// =========================================

function isExpiringSoon(expiresAt) {

    if (!expiresAt) {

        return false;
    }


    const expiry =
        new Date(
            expiresAt
        ).getTime();


    const now =
        Date.now();


    const difference =
        expiry - now;


    const hoursLeft =
        difference /
        (1000 * 60 * 60);


    return (
        hoursLeft > 0 &&
        hoursLeft <= 48
    );
}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "Unknown";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown";
    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// =========================================
// COPY SHARE LINK
// =========================================

async function copyShareLink(
    url,
    button
) {

    try {

        await navigator.clipboard.writeText(
            url
        );


        const originalHTML =
            button.innerHTML;


        button.innerHTML = `

            <span>
                ✓
            </span>

            <span>
                Copied
            </span>

        `;


        setTimeout(() => {

            button.innerHTML =
                originalHTML;

        }, 1800);


    } catch (error) {

        console.error(
            "Copy Link Error:",
            error
        );


        alert(
            "Unable to copy share link."
        );
    }
}


// =========================================
// REVOKE SHARE
// =========================================

async function revokeShare(
    shareId
) {

    const confirmRevoke =
        confirm(
            "Are you sure you want to revoke this share?"
        );


    if (!confirmRevoke) {

        return;
    }


    try {

        const response =
            await authFetch(
                `${API_URL}/api/files/share/${shareId}`,
                {
                    method: "DELETE",
                }
            );


        // =========================================
        // AUTH ERROR
        // =========================================

        if (response.status === 401) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to revoke share."
            );

            return;
        }


        alert(
            "Share revoked successfully 🔐"
        );


        // =========================================
        // REFRESH
        // =========================================

        loadSharedFiles();


    } catch (error) {

        console.error(
            "Revoke Share Error:",
            error
        );


        alert(
            "Unable to connect to SecureVault server."
        );
    }
}


// =========================================
// SEARCH SHARED FILES
// =========================================

function setupSearch(shares) {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchInput) {

        return;
    }


    searchInput.oninput =
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            shares.forEach(
                (share, index) => {

                    const card =
                        sharedFilesContainer
                            .children[index];


                    if (!card) {

                        return;
                    }


                    const searchableText = `

                        ${share.originalname || ""}

                        ${share.recipient_email || ""}

                        ${share.status || ""}

                    `.toLowerCase();


                    card.style.display =
                        searchableText.includes(
                            search
                        )
                            ? ""
                            : "none";
                }
            );
        };
}


// =========================================
// REFRESH BUTTON
// =========================================

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        () => {

            refreshBtn.disabled =
                true;


            refreshBtn.textContent =
                "🔄 Refreshing...";


            loadSharedFiles()
                .finally(() => {

                    refreshBtn.disabled =
                        false;

                    refreshBtn.textContent =
                        "🔄 Refresh";

                });

        }
    );
}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================
// ESCAPE ATTRIBUTE
// =========================================

function escapeAttribute(value) {

    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );
}

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        performLogout
    );

}