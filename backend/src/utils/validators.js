const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validateRegistration = ({ name, email, password }) => {

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
        return "Name must be between 2 and 60 characters.";
    }

    if (typeof email !== "string" || email.length > 254 || !EMAIL_REGEX.test(email)) {
        return "Please enter a valid email address.";
    }

    if (typeof password !== "string") {
        return "Password is required.";
    }

    // bcrypt sirf pehle 72 bytes use karta hai, usse lamba password bekaar hai
    if (Buffer.byteLength(password, "utf8") > 72) {
        return "Password is too long (max 72 characters).";
    }

    if (
        password.length < 8 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
    ) {
        return "Password must be 8+ characters with uppercase, lowercase, number and special character.";
    }

    return null;   // null = sab sahi
};

module.exports = { validateRegistration };