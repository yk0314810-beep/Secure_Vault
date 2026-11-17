const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const getMasterKey = () => {
    const hex = process.env.FILE_ENCRYPTION_KEY;

    if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
        throw new Error("FILE_ENCRYPTION_KEY missing or invalid (need 64 hex characters)");
    }

    return Buffer.from(hex, "hex");
};

const assertEncryptionConfigured = () => {
    getMasterKey();
};

const aesEncrypt = (key, data) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    return { iv, tag: cipher.getAuthTag(), encrypted };
};

const aesDecrypt = (key, iv, tag, encrypted) => {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

const encryptBuffer = (plainBuffer) => {
    const dataKey = crypto.randomBytes(32);

    const file = aesEncrypt(dataKey, plainBuffer);
    const wrapped = aesEncrypt(getMasterKey(), dataKey);

    return {
        ciphertext: file.encrypted,
        encIv: file.iv.toString("base64"),
        encTag: file.tag.toString("base64"),
        encKey: Buffer.concat([wrapped.iv, wrapped.tag, wrapped.encrypted]).toString("base64")
    };
};

const decryptBuffer = (ciphertext, encKey, encIv, encTag) => {
    const blob = Buffer.from(encKey, "base64");

    const wrapIv = blob.subarray(0, IV_LENGTH);
    const wrapTag = blob.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const wrappedKey = blob.subarray(IV_LENGTH + TAG_LENGTH);

    const dataKey = aesDecrypt(getMasterKey(), wrapIv, wrapTag, wrappedKey);

    return aesDecrypt(
        dataKey,
        Buffer.from(encIv, "base64"),
        Buffer.from(encTag, "base64"),
        ciphertext
    );
};

module.exports = { assertEncryptionConfigured, encryptBuffer, decryptBuffer };