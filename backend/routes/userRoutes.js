const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authRole = require('../middleware/authRole');

router.post('/register', authMiddleware, authRole(['superuser']), userController.register);
router.post('/login', userController.login);
router.get('/users', userController.getAllUsers);
router.put('/users/:id/role', authMiddleware, authRole(['superuser']), userController.updateRole);
router.delete('/users/:id', authMiddleware, authRole(['superuser']), userController.deleteUser);

router.get('/info', authMiddleware, userController.getUserInfo);
router.put('/account/username', authMiddleware, userController.updateUsername);
router.put('/account/password', authMiddleware, userController.updatePassword);

module.exports = router;
