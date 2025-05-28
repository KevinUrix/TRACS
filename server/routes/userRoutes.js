const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/users', userController.getAllUsers);
router.put('/users/:id/role', userController.updateRole);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;
