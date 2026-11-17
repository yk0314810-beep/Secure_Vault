const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,

    handler: (req, res) => {

        return res.status(429).json({
            success: false,
            message:
                "Too many login attempts. 🔒 For your security, login has been temporarily locked. Please try again in 15 minutes."
        });

    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = loginLimiter;