const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

router.get('/', authenticateToken, taskController.getSharedTasks);
router.put('/:id', authenticateToken, taskController.updateSharedTask);
router.delete('/:id', authenticateToken, taskController.removeSharedTaskAccess);

module.exports = router;