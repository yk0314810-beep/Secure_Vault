const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");

const db = require("../config/db");

const { validateRegistration } = require("../utils/validators");

const loginAttempts = new Map();

const {
    generateRememberToken,
    hashRememberToken
} = require("../utils/rememberDevice");

const {
    createRememberedDevice,
    getRememberDeviceExpiry,
    findValidRememberedDevice,
    updateLastUsedAt,
    revokeRememberedDevice
} = require("../services/rememberDeviceService");

const {
    rememberCookieOptions
} = require("../config/cookieConfig");

const getProfile = (req, res) => {

    const sql = `
        SELECT id, name, email, mobile, role
        FROM users
        WHERE id = ?
    `;

    db.query(
        sql,
        [req.user.id],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User Not Found"
                });

            }

            const user = result[0];

            res.status(200).json({

                success: true,

                message:
                    "Welcome to SecureVault 🔐",

                user

            });

        }
    );

};

const adminDashboard = (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users) AS totalUsers,

            (SELECT COUNT(*) FROM files) AS totalFiles,

            (SELECT COALESCE(SUM(size), 0) FROM files) AS totalStorage,

            (SELECT COUNT(*) FROM file_shares) AS totalShares,

            (
                SELECT COUNT(*)
                FROM file_shares
                WHERE revoked_at IS NULL
                AND (
                    expires_at IS NULL
                    OR expires_at > NOW()
                )
            ) AS activeShares,

            (
                SELECT COUNT(*)
                FROM file_shares
                WHERE expires_at IS NOT NULL
                AND expires_at <= NOW()
                AND revoked_at IS NULL
            ) AS expiredShares,

            (
                SELECT COUNT(*)
                FROM file_shares
                WHERE revoked_at IS NOT NULL
            ) AS revokedShares
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log("Admin Stats Error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to Load Admin Statistics"
            });
        }

        const stats = result[0];

        res.status(200).json({

            success: true,

            message: "Admin Dashboard Loaded 👑",

            user: req.user,

            stats

        });

    });

};

const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body || {};

        const validationError = validateRegistration({ name, email, password });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [name, email, hashedPassword],
            (err, result) => {

                if (err) {
                    
                    if (err.code === "ER_DUP_ENTRY") {
                         return res.status(409).json({
                            success: false,
                            message: "An account with this email already exists."
                        });
                    }

                    console.log(
                        "Registration Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Registration Failed"
                    });
                }

                return res.status(201).json({
                    success: true,
                    message:
                        "User Registered Successfully 🚀"
                });

            }
        );

    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create account."
        });

    }
};

const loginUser = async (req, res) => {

    const { email, password, rememberDevice } = req.body;

    const sql = `
        SELECT * FROM users
        WHERE email = ?
    `;

    db.query(sql, [email], async (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const user = result[0];

        const attempts =
            loginAttempts.get(email) || 0;


        // =========================================
        // CHECK PASSWORD
        // =========================================

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isMatch) {

            const newAttempts =
                attempts + 1;

            loginAttempts.set(
                email,
                newAttempts
            );


            const remaining =
                5 - newAttempts;


            if (remaining <= 0) {

                return res.status(429).json({
                    success: false,
                    message:
                        "Too many failed login attempts. Please try again after 15 minutes."
                });

            }


            return res.status(401).json({

                success: false,

                message:
                    `Incorrect password. ${remaining} ${
                        remaining === 1
                            ? "attempt"
                            : "attempts"
                    } remaining.`

            });

        }


        // =========================================
        // SUCCESSFUL LOGIN
        // =========================================

        loginAttempts.delete(email);


        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        if (rememberDevice) {

            try {

                const rememberToken =
                    generateRememberToken();

                const tokenHash =
                    hashRememberToken(rememberToken);

                const expiresAt =
                    getRememberDeviceExpiry();

                const deviceName =
                    req.headers["user-agent"] || "Unknown Device";

                const ipAddress =
                    req.ip || "Unknown";

                const userAgent =
                    req.headers["user-agent"] || "Unknown";

                await createRememberedDevice(
                    user.id,
                    tokenHash,
                    deviceName,
                    ipAddress,
                    userAgent,
                    expiresAt
            );

            res.cookie(
                "rememberDevice",
                rememberToken,
                {
                    ...rememberCookieOptions,
                    expires: expiresAt
                }
            );

        } catch (error) {

            console.error(
                "Remember Device Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to remember this device."
            });

    }
}

        return res.status(200).json({

            success: true,

            message:
                "Login Successful 🚀",

            token

        });

    });
};

const rememberDeviceLogin = async (req, res) => {

    try {

        const rememberToken =
            req.cookies?.rememberDevice;

        if (!rememberToken) {

            return res.status(401).json({
                success: false,
                message: "Remember device session not found."
            });
        }

        const tokenHash =
            hashRememberToken(rememberToken);

        const device =
            await findValidRememberedDevice(tokenHash);

        if (!device) {

            res.clearCookie(
                "rememberDevice",
                rememberCookieOptions
            );

            return res.status(401).json({
                success: false,
                message: "Remember device session expired or revoked."
            });
        }

        // =========================================
        // UPDATE LAST USED
        // =========================================

        await updateLastUsedAt(device.id);


        // =========================================
        // REVOKE OLD REMEMBER TOKEN
        // =========================================

        await revokeRememberedDevice(device.id);


        // =========================================
        // GENERATE NEW REMEMBER TOKEN
        // =========================================

        const newRememberToken =
            generateRememberToken();

        const newTokenHash =
            hashRememberToken(newRememberToken);

        const newExpiresAt =
            getRememberDeviceExpiry();


        // =========================================
        // STORE NEW REMEMBER TOKEN
        // =========================================

        const deviceName =
            req.headers["user-agent"] || "Unknown Device";

        const ipAddress =
            req.ip || "Unknown";

        const userAgent =
            req.headers["user-agent"] || "Unknown";

        await createRememberedDevice(
            device.user_id,
            newTokenHash,
            deviceName,
            ipAddress,
            userAgent,
            newExpiresAt
        );


        // =========================================
        // SET NEW COOKIE
        // =========================================

        res.cookie(
            "rememberDevice",
            newRememberToken,
            {
                ...rememberCookieOptions,
                expires: newExpiresAt
            }
        );


        // =========================================
        // GENERATE NEW JWT
        // =========================================

        const jwtToken =
            jwt.sign(
                {
                    id: device.user_id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );


        // =========================================
        // RESPONSE
        // =========================================

        return res.status(200).json({

            success: true,

            message:
                "Device remembered successfully.",

            token: jwtToken

        });

            } catch (error) {

                console.error(
                    "Remember Device Login Error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to verify remembered device."
                });
            }
        };

const getAllUsers = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            mobile,
            role,
            created_at
        FROM users
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.status(200).json({
            success: true,
            count: result.length,
            users: result
        });

    });
};

const logoutUser = async (req, res) => {

    try {

        // =========================================
        // GET REMEMBER DEVICE COOKIE
        // =========================================

        const rememberToken =
            req.cookies?.rememberDevice;


        // =========================================
        // REVOKE REMEMBERED DEVICE
        // =========================================

        if (rememberToken) {

            const tokenHash =
                hashRememberToken(rememberToken);

            const device =
                await findValidRememberedDevice(tokenHash);

            if (device) {

                await revokeRememberedDevice(
                    device.id
                );

            }

        }


        // =========================================
        // CLEAR REMEMBER DEVICE COOKIE
        // =========================================

        res.clearCookie(
            "rememberDevice",
            rememberCookieOptions
        );


        // =========================================
        // LOGOUT RESPONSE
        // =========================================

        return res.status(200).json({

            success: true,

            message:
                "Logged out successfully 🔐"

        });

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to logout securely."

        });

    }

};

const deleteUser = (req, res) => {

    const userId = req.params.id;
    const adminId = req.user.id;


    // =========================================
    // PREVENT ADMIN FROM DELETING HIMSELF
    // =========================================

    if (Number(userId) === Number(adminId)) {

        return res.status(400).json({
            success: false,
            message: "You cannot delete your own admin account"
        });

    }


    // =========================================
    // CHECK USER EXISTS
    // =========================================

    const checkSql = `
        SELECT id, role
        FROM users
        WHERE id = ?
    `;


    db.query(
        checkSql,
        [userId],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User Not Found"
                });

            }


            // =========================================
            // DELETE USER
            // =========================================

            const deleteSql = `
                DELETE FROM users
                WHERE id = ?
            `;


            db.query(
                deleteSql,
                [userId],
                (deleteErr) => {

                    if (deleteErr) {

                        console.log(deleteErr);

                        return res.status(500).json({
                            success: false,
                            message: "Unable to Delete User"
                        });

                    }


                    res.status(200).json({

                        success: true,

                        message:
                            "User Deleted Successfully 🗑️"

                    });

                }
            );

        }
    );
};

const getAllFiles = (req, res) => {

    const sql = `
        SELECT
            files.id,
            files.originalname,
            files.mimetype,
            files.size,
            files.created_at,
            files.user_id,
            users.name AS owner_name,
            users.email AS owner_email

        FROM files

        JOIN users
            ON files.user_id = users.id

        ORDER BY files.created_at DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log("Admin Files Error:", err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.status(200).json({
            success: true,
            count: result.length,
            files: result
        });

    });
};

const deleteAdminFile = (req, res) => {

    const fileId = req.params.id;


    // =========================================
    // GET FILE DETAILS
    // =========================================

    const selectSql = `
        SELECT filepath
        FROM files
        WHERE id = ?
    `;


    db.query(
        selectSql,
        [fileId],
        (err, result) => {

            if (err) {

                console.log("Admin File Delete Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "File Not Found"
                });

            }


            const filePath =
                result[0].filepath;


            // =========================================
            // DELETE DATABASE RECORD
            // =========================================

            const deleteSql = `
                DELETE FROM files
                WHERE id = ?
            `;


            db.query(
                deleteSql,
                [fileId],
                (deleteErr) => {

                    if (deleteErr) {

                        console.log(
                            "Delete File DB Error:",
                            deleteErr
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Unable to Delete File"
                        });

                    }


                    // =========================================
                    // DELETE ACTUAL FILE
                    // =========================================

                    const fs = require("fs");

                    if (
                        fs.existsSync(filePath)
                    ) {

                        fs.unlink(
                            filePath,
                            (unlinkErr) => {

                                if (unlinkErr) {

                                    console.log(
                                        "Physical File Delete Error:",
                                        unlinkErr
                                    );

                                }

                            }
                        );

                    }


                    res.status(200).json({

                        success: true,

                        message:
                            "File Deleted Successfully 🗑️"

                    });

                }
            );

        }
    );
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    adminDashboard,
    getAllUsers,
    deleteUser,
    getAllFiles,
    deleteAdminFile,
    rememberDeviceLogin,
    logoutUser
}; 
