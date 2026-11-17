const crypto = require("crypto");

const generateRememberToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const hashRememberToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

module.exports = {
    generateRememberToken,
    hashRememberToken
};