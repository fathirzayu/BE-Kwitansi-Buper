const router = require('express').Router();
const kwitansiController = require('../controllers/kwitansiController');
const { verifyToken } = require("../middleware/auth");


router.post("/cetak", verifyToken, kwitansiController.createKwitansi);
router.get("/", verifyToken, kwitansiController.getAllKwitansi);
router.get("/export", kwitansiController.exportKwitansi);

module.exports = router;