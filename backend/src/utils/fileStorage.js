const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { encryptBuffer, decryptBuffer } = require("./cryptoService");

// backend/ folder ka path (kahin se bhi node chalao, ye same rahega)
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");
const UPLOAD_DIR = path.join(BACKEND_ROOT, "src", "uploads");

// DB mein "src/uploads/abc.enc" jaisa path rehta hai.
// Ye usse asli path banata hai, aur uploads folder ke bahar jaane se rokta hai.
const resolveStoredPath = (storedPath) => {
    const absolute = path.resolve(BACKEND_ROOT, storedPath);

    if (!absolute.startsWith(UPLOAD_DIR + path.sep)) {
        throw new Error("Invalid file path");
    }

    return absolute;
};

// File ko RAM mein encrypt karo, disk pe sirf encrypted version likho
const saveEncrypted = async (plainBuffer) => {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

    const filename = crypto.randomBytes(16).toString("hex") + ".enc";
    const absolute = path.join(UPLOAD_DIR, filename);

    const enc = encryptBuffer(plainBuffer);

    await fs.promises.writeFile(absolute, enc.ciphertext, { flag: "wx" });

    return {
        filename,
        filepath: path.posix.join("src", "uploads", filename),
        encKey: enc.encKey,
        encIv: enc.encIv,
        encTag: enc.encTag
    };
};

// File padho. Nayi encrypted ho to decrypt karo, purani plain ho to jaisi hai waisi do
const readFileContent = async (row) => {
    const raw = await fs.promises.readFile(resolveStoredPath(row.filepath));

    if (!row.is_encrypted) {
        return raw;
    }

    return decryptBuffer(raw, row.enc_key, row.enc_iv, row.enc_tag);
};

const removeStoredFile = async (storedPath) => {
    await fs.promises.unlink(resolveStoredPath(storedPath));
};

// Decrypt karke file download ke roop mein bhejo
const sendFileDownload = async (res, row) => {
    let content;

    try {
        content = await readFileContent(row);
    } catch (err) {
        console.error("File read/decrypt error:", err.message);

        return res.status(500).json({
            success: false,
            message: "Unable to read file (missing or integrity check failed)."
        });
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.attachment(row.originalname);
    res.type(row.mimetype || "application/octet-stream");
    res.send(content);
};

module.exports = {
    saveEncrypted,
    readFileContent,
    removeStoredFile,
    sendFileDownload,
    resolveStoredPath
};