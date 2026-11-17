const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

const loginLimiter = require("../middleware/rateLimitMiddleware");

const {
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
} = require("../controllers/authController");

router.post("/register", registerUser);

router.post("/login", loginLimiter, loginUser);

router.get("/profile", verifyToken, getProfile);

router.get("/admin", verifyToken, adminMiddleware, adminDashboard);

router.get("/admin/users", verifyToken, adminMiddleware, getAllUsers);

router.delete("/admin/users/:id", verifyToken, adminMiddleware, deleteUser);

router.get("/admin/files",verifyToken,adminMiddleware,getAllFiles);

router.delete("/admin/files/:id",verifyToken,adminMiddleware,deleteAdminFile);

router.post("/remember-login",loginLimiter,rememberDeviceLogin);

router.post("/logout",logoutUser);

module.exports = router;