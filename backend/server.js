require("dotenv").config();

require("./src/config/db");

const app = require("./src/app");

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});