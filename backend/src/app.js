require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");

app.get("/", (req, res) => {
    res.send("Welcome to SecureVault API 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

module.exports = app;