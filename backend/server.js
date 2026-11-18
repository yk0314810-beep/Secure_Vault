require("dotenv").config();

require("./src/config/db");

// Key galat ya missing ho to server start hote hi error de
require("./src/utils/cryptoService").assertEncryptionConfigured();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});