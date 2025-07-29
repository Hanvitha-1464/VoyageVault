const express=require('express');
const router=express.Router();
const { signup, login, getProfile, refreshToken } = require('../Controllers/AuthController');
const authenticateToken = require('../Middleware/AuthMiddleware');
const { validateSignup, validateLogin } = require('../Middleware/Validation');

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

router.get('/profile', authenticateToken, getProfile);
router.post('/refresh', authenticateToken, refreshToken);

module.exports = router;