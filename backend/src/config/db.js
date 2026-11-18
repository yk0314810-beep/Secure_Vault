const mysql = require("mysql2");

// Pool: connection toote to khud naya bana leta hai (live ke liye zaroori)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
    // TiDB (live database) ko secure connection chahiye
    ssl: process.env.DB_SSL === "true"
        ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
        : undefined
});

pool.getConnection((err, connection) => {
    if (err) {
        console.log("❌ Database Connection Failed");
        console.log(err.message);
        return;
    }

    console.log("✅ MySQL Connected Successfully");
    connection.release();
});

module.exports = pool;