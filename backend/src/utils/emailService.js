const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

const sendShareEmail = async (recipientEmail, fileName, shareToken) => {

    // Render free plan SMTP block karta hai, wahan EMAIL_DISABLED=true rakhenge
    if (process.env.EMAIL_DISABLED === "true") {
        throw new Error("Email sending is disabled on this server");
    }

    const baseUrl = process.env.APP_URL || "http://127.0.0.1:5500";

    const shareLink =
        `${baseUrl}/frontend/share.html?token=${encodeURIComponent(shareToken)}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: "🔐 SecureVault - A File Has Been Shared With You",
        text: `
Someone has securely shared a file with you.

File: ${fileName}

Open the file using this link:
${shareLink}

You will need the sharing password to access the file.

Do not share this link publicly.
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendShareEmail
};