const startsWith = (buf, bytes, offset = 0) =>
    buf.length >= offset + bytes.length &&
    bytes.every((b, i) => buf[offset + i] === b);

const isPdf  = (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]);                    // %PDF
const isJpeg = (b) => startsWith(b, [0xFF, 0xD8, 0xFF]);
const isPng  = (b) => startsWith(b, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const isWebp = (b) =>
    startsWith(b, [0x52, 0x49, 0x46, 0x46]) &&                                   // RIFF
    startsWith(b, [0x57, 0x45, 0x42, 0x50], 8);                                   // WEBP
const isZip  = (b) => startsWith(b, [0x50, 0x4B, 0x03, 0x04]);                    // PK (zip, docx, xlsx)
const isOle  = (b) =>
    startsWith(b, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);             // purani .doc / .xls

// Text file mein NUL byte (0x00) nahi hoti
const isText = (b) => !b.subarray(0, 8192).includes(0x00);

const CHECKS = {
    "application/pdf": isPdf,
    "image/jpeg": isJpeg,
    "image/png": isPng,
    "image/webp": isWebp,
    "application/zip": isZip,
    "application/x-zip-compressed": isZip,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": isZip,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": isZip,
    "application/msword": isOle,
    "application/vnd.ms-excel": isOle,
    "text/plain": isText
};

const hasValidSignature = (buffer, mimetype) => {
    const check = CHECKS[mimetype];

    if (!check || !buffer || buffer.length === 0) {
        return false;
    }

    return check(buffer);
};

module.exports = { hasValidSignature };