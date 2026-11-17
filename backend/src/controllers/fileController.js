const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { saveEncrypted, removeStoredFile, sendFileDownload } = require("../utils/fileStorage");
const { sendShareEmail } = require("../utils/emailService");
const db = require("../config/db");
const unlinkStored = (storedPath, cb) =>
    removeStoredFile(storedPath).then(() => cb(null)).catch(cb);
const { hasValidSignature } = require("../utils/fileValidator");

// =========================================================
// UPLOAD FILE
// =========================================================

const uploadFile = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }

    // memoryStorage mein file RAM mein hoti hai: req.file.buffer
    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user.id;

    // Asli content check (browser ka mimetype fake ho sakta hai)
    if (!hasValidSignature(buffer, mimetype)) {
        return res.status(400).json({
            success: false,
            message: "File content does not match its type. Upload rejected."
        });
    }

    let saved;

    try {
        // encrypt karo aur sirf encrypted version disk pe likho
        saved = await saveEncrypted(buffer);
    } catch (error) {
        console.error("Encryption/Save Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to store file securely"
        });
    }

    const sql = `
        INSERT INTO files
        (filename, originalname, filepath, mimetype, size, user_id,
         is_encrypted, enc_key, enc_iv, enc_tag)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            saved.filename,
            originalname,
            saved.filepath,
            mimetype,
            size,
            userId,
            saved.encKey,
            saved.encIv,
            saved.encTag
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                // DB fail hua to disk pe bachi encrypted file hata do
                removeStoredFile(saved.filepath).catch(() => {});

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            res.status(201).json({
                success: true,
                message: "File Uploaded Successfully 🚀",
                fileId: result.insertId
            });
        }
    );
};


// =========================================================
// DOWNLOAD OWN FILE
// =========================================================

const downloadFile = (req, res) => {

    const fileId = req.params.id;
    const userId = req.user.id;

    const sql = `
        SELECT *
        FROM files
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [fileId, userId], (err, result) => {

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
                message: "File Not Found or Access Denied"
            });
        }

        const file = result[0];

        sendFileDownload(res,file);
    });
};


// =========================================================
// DELETE FILE
// =========================================================

const deleteFile = (req, res) => {

    const fileId = req.params.id;
    const userId = req.user.id;

    const sql = `
        SELECT *
        FROM files
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [fileId, userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "File Not Found or Access Denied"
            });
        }

        const file = result[0];

        unlinkStored(file.filepath, (err) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to Delete File"
                });
            }

            const deleteSql = `
                DELETE FROM files
                WHERE id = ? AND user_id = ?
            `;

            db.query(
                deleteSql,
                [fileId, userId],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: "File Deleted Successfully 🗑️"
                    });
                }
            );
        });
    });
};


// =========================================================
// REVOKE SHARE
// =========================================================

const revokeShare = (req, res) => {

    const shareId = req.params.id;
    const ownerId = req.user.id;

    // IMPORTANT:
    // We don't DELETE the share anymore.
    // We mark it as revoked so history remains available.

    const sql = `
        UPDATE file_shares
        SET revoked_at = NOW()
        WHERE id = ?
        AND owner_id = ?
        AND revoked_at IS NULL
    `;

    db.query(
        sql,
        [shareId, ownerId],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Share Not Found, Already Revoked, or Access Denied"
                });
            }

            res.status(200).json({
                success: true,
                message: "File Share Revoked Successfully 🔒"
            });
        }
    );
};


// =========================================================
// GET MY SHARED FILES
// =========================================================

const getMySharedFiles = (req, res) => {

    const ownerId = req.user.id;

    const sql = `
        SELECT
            file_shares.id,
            file_shares.file_id,
            files.originalname,
            file_shares.recipient_email,
            file_shares.expires_at,
            file_shares.revoked_at,
            file_shares.access_count,
            file_shares.last_accessed_at,
            file_shares.created_at,

            CASE

                WHEN file_shares.revoked_at IS NOT NULL
                    THEN 'Revoked'

                WHEN file_shares.expires_at IS NULL
                    THEN 'Active'

                WHEN file_shares.expires_at > NOW()
                    THEN 'Active'

                ELSE 'Expired'

            END AS status

        FROM file_shares

        JOIN files
            ON file_shares.file_id = files.id

        WHERE file_shares.owner_id = ?

        ORDER BY file_shares.created_at DESC
    `;

    db.query(
        sql,
        [ownerId],
        (err, result) => {

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
                shares: result
            });
        }
    );
};


// =========================================================
// GET MY FILES
// =========================================================

const getMyFiles = (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT
            id,
            originalname,
            mimetype,
            size,
            created_at

        FROM files

        WHERE user_id = ?

        ORDER BY created_at DESC
    `;

    db.query(
        sql,
        [userId],
        (err, result) => {

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
                files: result
            });
        }
    );
};


// =========================================================
// SHARE FILE
// =========================================================

const shareFile = async (req, res) => {

    try {

        const fileId = req.body.fileId;
        const recipientEmail = req.body.recipientEmail;
        const sharePassword = req.body.password;
        const ownerId = req.user.id;
        const expiry = req.body.expiry;

        let expiresAt = null;

        // -----------------------------------------
        // EXPIRY
        // -----------------------------------------

        if (expiry === "1h") {

            expiresAt =
                new Date(
                    Date.now() +
                    60 * 60 * 1000
                );

        } else if (expiry === "24h") {

            expiresAt =
                new Date(
                    Date.now() +
                    24 * 60 * 60 * 1000
                );

        } else if (expiry === "7d") {

            expiresAt =
                new Date(
                    Date.now() +
                    7 * 24 * 60 * 60 * 1000
                );
        }


        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        if (
            !fileId ||
            !recipientEmail ||
            !sharePassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "File ID, recipient email and password are required"
            });
        }


        if (sharePassword.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Share password must be at least 6 characters"
            });
        }

        // -----------------------------------------
        // DOWNLOAD LIMIT (khali = unlimited)
        // -----------------------------------------

        const ALLOWED_LIMITS = [1, 3, 5, 10];
        let maxDownloads = null;

        const rawLimit = req.body.maxDownloads;

        if (rawLimit !== undefined && rawLimit !== null && rawLimit !== "") {

            maxDownloads = Number(rawLimit);

            if (!ALLOWED_LIMITS.includes(maxDownloads)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid download limit"
                });
            }
        }


        // -----------------------------------------
        // CHECK FILE OWNERSHIP
        // -----------------------------------------

        const checkSql = `
            SELECT *
            FROM files
            WHERE id = ?
            AND user_id = ?
        `;

        db.query(
            checkSql,
            [fileId, ownerId],
            async (err, result) => {

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
                        message:
                            "File Not Found or Access Denied"
                    });
                }


                const file = result[0];


                // -----------------------------------------
                // HASH PASSWORD
                // -----------------------------------------

                const passwordHash =
                    await bcrypt.hash(
                        sharePassword,
                        10
                    );


                // -----------------------------------------
                // SECURE TOKEN
                // -----------------------------------------

                const shareToken =
                    crypto
                        .randomBytes(32)
                        .toString("hex");


                // -----------------------------------------
                // INSERT SHARE
                // -----------------------------------------

                const insertSql = `
                    INSERT INTO file_shares
                    (
                        file_id,
                        owner_id,
                        recipient_email,
                        password_hash,
                        share_token,
                        expires_at,
                        max_downloads
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    insertSql,
                    [
                        fileId,
                        ownerId,
                        recipientEmail,
                        passwordHash,
                        shareToken,
                        expiresAt,
                        maxDownloads
                    ],
                    async (err) => {

                        if (err) {

                            console.log(err);

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to Create Share"
                            });
                        }


                        // -----------------------------------------
                        // SEND EMAIL
                        // -----------------------------------------

                        try {

                            await sendShareEmail(
                                recipientEmail,
                                file.originalname,
                                shareToken
                            );


                            return res.status(201).json({

                                success: true,

                                message:
                                    "File Shared Successfully 📧🔐",

                                shareToken

                            });

                        } catch (error) {

                            console.log(
                                "Email Error:",
                                error
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "File Shared, but Email Could Not Be Sent"

                            });
                        }

                    }
                );
            }
        );

    } catch (error) {

        console.log(
            "Share File Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to Create Share"
        });
    }
};


// =========================================================
// ACCESS SHARED FILE
// =========================================================

const accessSharedFile = async (req, res) => {

    const shareToken = req.params.token;
    const { password } = req.body;

    if (!password) {

        return res.status(400).json({
            success: false,
            message: "Password is required"
        });
    }


    const sql = `
        SELECT
            file_shares.*,
            files.originalname,
            files.filepath

        FROM file_shares

        JOIN files
            ON file_shares.file_id = files.id

        WHERE file_shares.share_token = ?
    `;

    db.query(
        sql,
        [shareToken],
        async (err, result) => {

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
                    message:
                        "Invalid Share Link"
                });
            }


            const share = result[0];


            // -----------------------------------------
            // REVOKED CHECK
            // -----------------------------------------

            if (share.revoked_at) {

                return res.status(410).json({
                    success: false,
                    message:
                        "This Share Link Has Been Revoked 🔒"
                });
            }


            // -----------------------------------------
            // EXPIRY CHECK
            // -----------------------------------------

            if (
                share.expires_at &&
                new Date() >
                new Date(share.expires_at)
            ) {

                return res.status(410).json({
                    success: false,
                    message:
                        "Share Link Expired ⏰"
                });
            }


            // -----------------------------------------
            // PASSWORD CHECK
            // -----------------------------------------

            const isMatch =
                await bcrypt.compare(
                    password,
                    share.password_hash
                );


            if (!isMatch) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid Password"
                });
            }

            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.status(200).json({

                success: true,

                message:
                    "Access Granted 🔓",

                file: {

                    id: share.file_id,

                    originalname:
                        share.originalname

                },

                downloadToken:
                    share.share_token

            });
        }
    );
};


// =========================================================
// DOWNLOAD SHARED FILE
// =========================================================

const downloadSharedFile = async (req, res) => {

    const shareToken = req.params.token;
    const { password } = req.body;

    if (!password) {

        return res.status(400).json({
            success: false,
            message: "Password is required"
        });
    }


    const sql = `
        SELECT
            file_shares.id,
            file_shares.password_hash,
            file_shares.expires_at,
            file_shares.revoked_at,

            files.filepath,
            files.originalname,
            files.mimetype,
            files.is_encrypted,
            files.enc_key,
            files.enc_iv,
            files.enc_tag

        FROM file_shares

        JOIN files
            ON file_shares.file_id = files.id

        WHERE file_shares.share_token = ?
    `;

    db.query(
        sql,
        [shareToken],
        async (err, result) => {

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
                    message:
                        "Invalid Share Link"
                });
            }


            const share = result[0];


            // -----------------------------------------
            // REVOKED CHECK
            // -----------------------------------------

            if (share.revoked_at) {

                return res.status(410).json({
                    success: false,
                    message:
                        "This Share Link Has Been Revoked 🔒"
                });
            }


            // -----------------------------------------
            // EXPIRY CHECK
            // -----------------------------------------

            if (
                share.expires_at &&
                new Date() >
                new Date(share.expires_at)
            ) {

                return res.status(410).json({
                    success: false,
                    message:
                        "Share Link Expired ⏰"
                });
            }


            // -----------------------------------------
            // PASSWORD CHECK
            // -----------------------------------------

            const isMatch =
                await bcrypt.compare(
                    password,
                    share.password_hash
                );


            if (!isMatch) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid Password"
                });
            }


            // -----------------------------------------
            // COUNT DOWNLOAD + CHECK LIMIT (ek hi query mein)
            // -----------------------------------------

            const updateSql = `
                UPDATE file_shares
                SET
                    access_count = access_count + 1,
                    last_accessed_at = NOW()
                WHERE id = ?
                AND (max_downloads IS NULL OR access_count < max_downloads)
            `;

            db.query(
                updateSql,
                [share.id],
                (updateErr, updateResult) => {

                    if (updateErr) {
                        console.log("Download Tracking Error:", updateErr);

                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });
                    }

                    // 0 rows badli = limit pura ho chuki
                    if (updateResult.affectedRows === 0) {
                        return res.status(410).json({
                            success: false,
                            message: "Download limit reached for this link 🚫"
                        });
                    }

                    // limit baaki hai, file bhejo
                    sendFileDownload(res, share);
                }
            );
        }
    );
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    uploadFile,

    downloadFile,

    deleteFile,

    getMyFiles,

    shareFile,

    accessSharedFile,

    downloadSharedFile,

    revokeShare,

    getMySharedFiles
};