const router = require('express').Router();
const { authController } = require('../controllers');
const { verifyToken } = require('../middleware/auth');
const { multerUpload } = require('../middleware/multer')


router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/keeplogin", verifyToken, authController.keeplogin);
router.post("/reset-password", authController.resetPassword);
router.post('/avatar', verifyToken, multerUpload().single('file') , authController.addAvatar);





module.exports = router;