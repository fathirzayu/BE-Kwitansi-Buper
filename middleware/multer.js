const multer = require("multer");
const path = require("path");
const fs = require("fs");

module.exports = {
  multerUpload: (
    directory = "./public",
    name = "FILE",
    allowedExt = ["jpg", "jpeg", "png", "gif", "xlsx", "xls"]
  ) => {
    // pastikan folder ada, kalau belum buat
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, directory);
      },
      filename: (req, file, cb) => {
        const uniqueName =
          `${name}-${Date.now()}-${Math.round(Math.random() * 100000)}` +
          path.extname(file.originalname).toLowerCase();
        cb(null, uniqueName);
      },
    });

    const fileFilter = (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      if (!allowedExt.includes(ext)) {
        return cb(new Error("Your file extension is not allowed"), false);
      }
      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
    });
  },
};
