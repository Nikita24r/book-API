const express = require('express');
const router = express.Router();
const AuthController = require('../Controller/BookUserAuthController');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/reset-password', AuthController.resetPassword);


module.exports = router;
