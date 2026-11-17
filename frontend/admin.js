const API_URL = "http://127.0.0.1:5000";

const token = localStorage.getItem("token");

const message = document.getElementById("adminMessage");


// =========================================
// CHECK LOGIN
// =========================================

if (!token) {

    message.textContent =
        "Login required.";

} else {

    loadAdminDashboard();

}


// =========================================
// LOAD ADMIN DASHBOARD
// =========================================

async function loadAdminDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/api/auth/admin`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.message ||
                "Unable to load admin dashboard.";

            return;
        }


        const stats = data.stats;


        document.getElementById("totalUsers")
            .textContent = stats.totalUsers;

        document.getElementById("totalFiles")
            .textContent = stats.totalFiles;

        document.getElementById("totalShares")
            .textContent = stats.totalShares;

        document.getElementById("activeShares")
            .textContent = stats.activeShares;

        document.getElementById("expiredShares")
            .textContent = stats.expiredShares;

        document.getElementById("revokedShares")
            .textContent = stats.revokedShares;

        await loadUsers();
        await loadFiles();


        const storageBytes =
            Number(stats.totalStorage) || 0;

        const storageKB =
            (storageBytes / 1024).toFixed(2);

        document.getElementById("totalStorage")
            .textContent =
            `${storageKB} KB`;


        message.textContent =
            "Admin Dashboard Loaded 👑";


    } catch (error) {

        console.error(
            "Admin Dashboard Error:",
            error
        );

        message.textContent =
            "Unable to connect to SecureVault server.";
    }
}

// =========================================
// LOAD ALL USERS
// =========================================

async function loadUsers() {

    const tableBody =
        document.getElementById("usersTableBody");

    if (!tableBody) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/auth/admin/users`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        ${data.message || "Unable to load users."}
                    </td>
                </tr>
            `;

            return;
        }


        const users =
            data.users || [];


        if (users.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        users.forEach(user => {

            const row =
                document.createElement("tr");


            const createdDate =
                user.created_at
                    ? new Date(
                        user.created_at
                    ).toLocaleDateString()
                    : "Unknown";


            row.innerHTML = `

                <td>
                    ${user.id}
                </td>

                <td>
                    ${escapeHTML(user.name)}
                </td>

                <td>
                    ${escapeHTML(user.email)}
                </td>

                <td>
                    ${escapeHTML(user.mobile)}
                </td>

                <td>

                    <span class="
                        ${user.role === "admin"
                            ? "admin-role"
                            : "user-role"}
                    ">

                        ${user.role === "admin"
                            ? "👑 Admin"
                            : "👤 User"}

                    </span>

                </td>

                <td>
                    ${createdDate}
                </td>

                <td>
                    
                    ${
                        Number(user.id) === Number (
                            JSON.parse(
                                atob(
                                    token.split(".")[1]
                                )
                            ).id
                        )
                        ? `<span class="protected-user">
                                🔐 Current Admin
                            <span>`

                        : `<button
                                class="delete-user-btn"
                                onclick="deleteUser(${user.id})"
                            >
                                🗑️ Delete
                            </button>`
                       
                    }
                </td>
            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Load Users Error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    Unable to connect to SecureVault server.
                </td>
            </tr>
        `;
    }
}

// =========================================
// LOAD ALL FILES
// =========================================

async function loadFiles() {

    const tableBody =
        document.getElementById("filesTableBody");

    if (!tableBody) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/auth/admin/files`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        ${data.message || "Unable to load files."}
                    </td>
                </tr>
            `;

            return;
        }

        const files =
            data.files || [];

        if (files.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No files found.
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML = "";

        files.forEach(file => {

            const row =
                document.createElement("tr");

            const createdDate =
                file.created_at
                    ? new Date(
                        file.created_at
                    ).toLocaleDateString()
                    : "Unknown";

            const fileSize =
                formatFileSize(file.size);

            row.innerHTML = `

                <td>
                    ${file.id}
                </td>

                <td>
                    📄 ${escapeHTML(
                        file.originalname
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        file.owner_name || "Unknown"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        file.owner_email || "Unknown"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        file.mimetype || "Unknown"
                    )}
                </td>

                <td>
                    ${fileSize}
                </td>

                <td>
                    ${createdDate}
                </td>

                <td>
                    <button
                        class="delete-file-btn"
                        onclick="deleteAdminFile(${file.id})"
                    >
                        🗑️ Delete
                    </button>
                </td>

            `;

            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Load Files Error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    Unable to connect to SecureVault server.
                </td>
            </tr>
        `;
    }
}


// =========================================
// FORMAT FILE SIZE
// =========================================

function formatFileSize(bytes) {

    if (!bytes || bytes === 0) {
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
            (bytes /
            Math.pow(1024, index))
            .toFixed(2)
        ) +
        " " +
        units[index]
    );
}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}

async function deleteUser(userId) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this user?"
        );

    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/api/auth/admin/users/${userId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to delete user."
            );

            return;
        }


        alert(
            "User deleted successfully 🗑️"
        );


        // Refresh dashboard

        loadAdminDashboard();


    } catch (error) {

        console.error(
            "Delete User Error:",
            error
        );

        alert(
            "Unable to connect to SecureVault server."
        );
    }
}

async function deleteAdminFile(fileId) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this file?"
        );

    if (!confirmDelete) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/api/auth/admin/files/${fileId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to delete file."
            );

            return;
        }


        alert(
            "File deleted successfully 🗑️"
        );


        // Refresh files table
        await loadFiles();

        // Refresh dashboard statistics
        await loadAdminDashboard();


    } catch (error) {

        console.error(
            "Delete Admin File Error:",
            error
        );

        alert(
            "Unable to connect to SecureVault server."
        );
    }
}