const router = require('express').Router();
const { mahasiswaController } = require('../controllers');
const { verifyToken } = require('../middleware/auth');
const { multerUpload } = require('../middleware/multer');


router.post("/add", verifyToken, mahasiswaController.addMahasiswa);
router.get("/", verifyToken, mahasiswaController.allMahasiswa);
router.post("/upload-excel", multerUpload("./uploads", "EXCEL", ["xlsx", "xls"]).single("file"),mahasiswaController.uploadExcel);



module.exports = router;