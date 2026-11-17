const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendShareEmail = async (recipientEmail, fileName, shareToken) => {

    const shareLink =
        `http://127.0.0.1:5500/frontend/share.html?token=${encodeURIComponent(shareToken)}`;

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