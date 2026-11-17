const multer = require("multer");
const path = require("path");

// =========================================
// STORAGE CONFIGURATION
// =========================================

const storage = multer.memoryStorage();


// =========================================
// FILE TYPE FILTER
// =========================================

const fileFilter = (req, file, cb) => {

    const allowedTypes = [

        // Documents
        "application/pdf",

        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "text/plain",

        // Images
        "image/jpeg",
        "image/png",
        "image/webp",

        // ZIP
        "application/zip",
        "application/x-zip-compressed"

    ];


    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "File type not allowed. Please upload a supported file."
            ),
            false
        );

    }

};


// =========================================
// MULTER CONFIGURATION
// =========================================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024
    }

});


module.exports = upload;