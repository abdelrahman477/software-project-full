const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getUserProfile, getUsers, updateUser } = require('../controllers/userController');

router.get('/', authenticateToken, authorizeRoles('admin'), getUsers);
router.get('/:id', authenticateToken, getUserProfile);
router.put('/:id', authenticateToken, updateUser);

module.exports = router;