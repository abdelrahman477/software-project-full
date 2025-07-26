const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');

const getUserTasks = async (req, res) => {
    const userId = req.user.userId;
    try {
        const tasks = await taskModel.getAllTasks(userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

const newTask = async (req, res) => {
    const userId = req.user.userId;
    const { title, description, due_date, status, priority } = req.body;
    if (!title || !description || !due_date || !status || !priority) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (due_date < new Date()) {
        return res.status(400).json({ error: 'Due date cannot be in the past' });
    }
    if (status !== 'pending' && status !== 'completed' && status !== 'in_progress') {
        return res.status(400).json({ error: 'Invalid status' });
    }
    if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
        return res.status(400).json({ error: 'Invalid priority' });
    }

    const task = {
        title,
        description,
        due_date,
        status,
        priority,
    }
    try {
        const newTask = await taskModel.createTask(task, userId);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};

const getSpecificTask = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    try {
        const task = await taskModel.getTaskById(taskId, userId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
};

const updateTask = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const { title, description, due_date, status, priority } = req.body;
    if (!title || !description || !due_date || !status || !priority) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (due_date < new Date()) {
        return res.status(400).json({ error: 'Due date cannot be in the past' });
    }
    if (status !== 'pending' && status !== 'completed' && status !== 'in_progress') {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const task = {
        title,
        description,
        due_date,
        status,
        priority,
    }
    try {
        const updatedTask = await taskModel.updateTask(taskId, task, userId);
        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

const deleteATask = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    try {
        const deletedTask = await taskModel.deleteTask(taskId, userId);
        if (!deletedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

const shareTask = async (req, res) => {
    const ownerId = req.user.userId;
    const taskId = req.params.id;
    const { sharedWithId, permissionLevel = 'read' } = req.body;
    if (!sharedWithId) {
        return res.status(400).json({ error: 'sharedWithId is required' });
    }
    if (permissionLevel !== 'read' && permissionLevel !== 'write') {
        return res.status(400).json({ error: 'Invalid permission level' });
    }
    try {
        const isOwner = await taskModel.checkOwner(taskId, ownerId);
        if (!isOwner) {
            return res.status(403).json({ error: 'You are not the owner of this task' });
        }
        const userToShareWith = await userModel.getUserById(sharedWithId);
        if (!userToShareWith) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isAlreadyShared = await taskModel.checkShared(taskId, sharedWithId);
        if (isAlreadyShared) {
            return res.status(400).json({ error: 'Task is already shared with this user' });
        }
        const sharedTask = await taskModel.shareTask(taskId, ownerId, sharedWithId, permissionLevel);
        res.status(201).json(sharedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to share task' });
    }
};

const getSharedTasks = async (req, res) => {
    const userId = req.user.userId;
    try {
        const sharedTasks = await taskModel.getSharedTasks(userId);
        res.status(200).json(sharedTasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shared tasks' });
    }
};

const getSharedTaskById = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    try {
        const sharedTask = await taskModel.getSharedTaskById(taskId, userId);
        if (!sharedTask) {
            return res.status(404).json({ error: 'Shared task not found' });
        }
        res.status(200).json(sharedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shared task' });
    }
};

const updateSharedTask = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const { title, description, due_date, status, priority } = req.body;
    if (!title || !description || !due_date || !status || !priority) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (due_date < new Date()) {
        return res.status(400).json({ error: 'Due date cannot be in the past' });
    }
    if (status !== 'pending' && status !== 'completed' && status !== 'in_progress') {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const task = {
        title,
        description,
        due_date,
        status,
        priority,
    }
    try {
        const updatedTask = await taskModel.updateSharedTask(taskId, task, userId);
        if (!updatedTask) {
            return res.status(404).json({ error: 'You do not have permission to update this task' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update shared task' });
    }
};

const removeSharedTaskAccess = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    try {
        const removedTask = await taskModel.removedAccess(taskId, userId);
        if (!removedTask) {
            return res.status(404).json({ error: 'Shared task access not found' });
        }
        res.status(200).json({ message: 'Access to shared task removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove shared task access' });
    }
};

const updateStatus = async (req, res) => {
    const userId = req.user.userId;
    const taskId = req.params.id;
    const { status } = req.body;
    try {
        const updatedTask = await taskModel.updateTaskStatus(taskId, status, userId);
        if (!updatedTask) {
            return res.status(404).json({ error: 'You do not have permission to update this task' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task status' });
    }
};

const filterTasks = async (req, res) => {
    const userId = req.user.userId;
    const { dueDate, status, priority } = req.query;

    try {
        const filteredTasks = await taskModel.filterTasks(userId, { dueDate, status, priority });
        res.status(200).json(filteredTasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter tasks' });
    }
};

const sortTasks = async (req, res) => {
    const userId = req.user.userId;
    const { sortBy, order } = req.query;

    // Validate sort parameters
    const validSortFields = ['created_at', 'priority', 'due_date', 'title'];
    const validOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ error: 'Invalid sort field. Use: created_at, priority, due_date, or title' });
    }

    if (!validOrders.includes(order)) {
        return res.status(400).json({ error: 'Invalid order. Use: asc or desc' });
    }

    try {
        const sortedTasks = await taskModel.sortTasks(userId, sortBy, order);
        res.status(200).json(sortedTasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to sort tasks' });
    }
};

module.exports = {
    getUserTasks,
    newTask,
    getSpecificTask,
    updateTask,
    deleteATask,
    shareTask,
    getSharedTasks,
    updateSharedTask,
    removeSharedTaskAccess,
    getSharedTaskById,
    updateStatus,
    filterTasks,
    sortTasks
};