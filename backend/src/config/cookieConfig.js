const isProduction =
    process.env.NODE_ENV === "production";

const rememberCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000
};

module.exports = {
    rememberCookieOptions,
    isProduction
};