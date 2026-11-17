const express = require("express");

const router = express.Router();

const shareLimiter = require("../middleware/shareRateLimit");

const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    uploadFile,
    downloadFile,
    deleteFile,
    getMyFiles,
    shareFile,
    accessSharedFile,
    downloadSharedFile,
    revokeShare,
    getMySharedFiles
} = require("../controllers/fileController");

router.post(
    "/upload",
    verifyToken,
    upload.single("file"),
    uploadFile
);

router.get(
    "/",
    verifyToken,
    getMyFiles
);

router.get(
    "/shared",
    verifyToken,
    getMySharedFiles
);

router.post(
    "/share",
    verifyToken,
    shareFile
);

router.post(
    "/shared/:token",
    shareLimiter,
    accessSharedFile
);

router.post(
    "/shared/:token/download",
    shareLimiter,
    downloadSharedFile
);

router.get(
    "/:id/download",
    verifyToken,
    downloadFile
);

router.delete(
    "/:id",
    verifyToken,
    deleteFile
);

router.delete(
    "/share/:id",
    verifyToken,
    revokeShare
);

module.exports = router;