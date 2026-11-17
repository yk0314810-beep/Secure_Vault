const db = require("../config/db");

const REMEMBER_DEVICE_DAYS = 30;

const createRememberedDevice = (
    userId,
    tokenHash,
    deviceName,
    ipAddress,
    userAgent,
    expiresAt
) => {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO remembered_devices
            (
                user_id,
                token_hash,
                device_name,
                ip_address,
                user_agent,
                expires_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                userId,
                tokenHash,
                deviceName,
                ipAddress,
                userAgent,
                expiresAt
            ],
            (err, result) => {

                if (err) {
                    return reject(err);
                }

                resolve(result);
            }
        );

    });

};

const getRememberDeviceExpiry = () => {

    const expiry = new Date();

    expiry.setDate(
        expiry.getDate() + REMEMBER_DEVICE_DAYS
    );

    return expiry;
};

const findValidRememberedDevice = (tokenHash) => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT *
            FROM remembered_devices
            WHERE token_hash = ?
              AND revoked_at IS NULL
              AND expires_at > NOW()
            LIMIT 1
        `;

        db.query(
            sql,
            [tokenHash],
            (err, results) => {

                if (err) {
                    return reject(err);
                }

                resolve(results[0] || null);
            }
        );

    });

};

const updateLastUsedAt = (deviceId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE remembered_devices
            SET last_used_at = NOW()
            WHERE id = ?
        `;

        db.query(
            sql,
            [deviceId],
            (err, result) => {

                if (err) {
                    return reject(err);
                }

                resolve(result);
            }
        );

    });

};

const revokeRememberedDevice = (deviceId) => {

    return new Promise((resolve, reject) => {

        const sql = `
            UPDATE remembered_devices
            SET revoked_at = NOW()
            WHERE id = ?
              AND revoked_at IS NULL
        `;

        db.query(
            sql,
            [deviceId],
            (err, result) => {

                if (err) {
                    return reject(err);
                }

                resolve(result);
            }
        );

    });

};

module.exports = {
    createRememberedDevice,
    getRememberDeviceExpiry,
    findValidRememberedDevice,
    updateLastUsedAt,
    revokeRememberedDevice
};