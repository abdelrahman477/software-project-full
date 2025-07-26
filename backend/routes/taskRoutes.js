const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');

router.get('/', authenticateToken, taskController.getUserTasks);
router.get('/filter', authenticateToken, taskController.filterTasks);
router.get('/sort', authenticateToken, taskController.sortTasks);
router.post('/', authenticateToken, taskController.newTask);

router.get('/:id/comments', authenticateToken, commentController.getCommentsForTask);
router.post('/:id/comments', authenticateToken, commentController.createComment);

router.get('/:id', authenticateToken, taskController.getSpecificTask);
router.put('/:id', authenticateToken, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteATask);

router.post('/:id/share', authenticateToken, taskController.shareTask);
router.put('/:id/status', authenticateToken, taskController.updateStatus);
module.exports = router;