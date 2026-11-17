const rateLimit = require("express-rate-limit");

const shareLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minute
    max: 20,                    // 20 koshishein per IP

    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: "Too many attempts. Please try again in 15 minutes."
        });
    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = shareLimiter;