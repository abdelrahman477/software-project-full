const commentModel = require('../models/commentModel');
const taskModel = require('../models/taskModel');

const getCommentsForTask = async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.userId;
    try {
        const task = await taskModel.getTaskById(taskId, userId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const comments = await commentModel.getCommentsByTaskId(taskId);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

const createComment = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;

    if (!req.body) {
        return res.status(400).json({ error: 'Request body is missing' });
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        const comment = await commentModel.createComment({ content }, userId, taskId);
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create comment' });
    }
};

module.exports = {
    getCommentsForTask,
    createComment
};