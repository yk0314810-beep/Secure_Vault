require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

// Render proxy ke peeche chalta hai, iske bina rate limit sab ko ek hi IP samajhta hai
app.set("trust proxy", 1);

const allowedOrigins = [
    "http://127.0.0.1:5500",
    process.env.APP_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Frontend bhi isi server se milega (ek hi URL)
app.use(
    "/frontend",
    express.static(path.join(__dirname, "..", "..", "frontend"))
);

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");

app.get("/", (req, res) => {
    res.redirect("/frontend/login.html");
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

module.exports = app;