const express = require('express');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', protect, restrictTo('admin'), authController.register);
router.get('/me', protect, authController.getMe);

module.exports = router;
