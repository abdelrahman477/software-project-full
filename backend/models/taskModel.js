const pool = require('../models/db');

const getAllTasks = async (userId) => {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
    return result.rows;
};

const getTaskById = async (id, userId) => {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]);
    return result.rows[0];
};

const createTask = async (task, userId) => {
    const { title, description, due_date, status, priority } = task;
    const result = await pool.query('INSERT INTO tasks (title, description, due_date, status, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [title, description, due_date, status, priority, userId]);
    return result.rows[0];
};

const updateTask = async (id, task, userId) => {
    const { title, description, due_date, status, priority } = task;
    const result = await pool.query('UPDATE tasks SET title = $1, description = $2, due_date = $3, status = $4, priority = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
        [title, description, due_date, status, priority, id, userId]);
    return result.rows[0];
};

const deleteTask = async (id, userId) => {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    return result.rows[0];
};

const shareTask = async (taskId, userId, sharedWithId, permissionLevel = 'read') => {
    const result = await pool.query('INSERT INTO shared_tasks (task_id, user_id, shared_with_id, permission_level) VALUES ($1, $2, $3, $4) RETURNING *',
        [taskId, userId, sharedWithId, permissionLevel]);
    return result.rows[0];
};

const getSharedTasks = async (userId) => {
    const result = await pool.query('SELECT t.*, st.permission_level, u.username as owner_name, st.created_at as shared_at FROM tasks t LEFT JOIN shared_tasks st ON t.id = st.task_id LEFT JOIN users u ON t.user_id = u.id WHERE st.shared_with_id = $1',
        [userId]);
    return result.rows;
};

const getSharedTaskById = async (taskId, userId) => {
    const result = await pool.query('SELECT t.*, st.permission_level, u.username as owner_name, st.created_at as shared_at FROM tasks t LEFT JOIN shared_tasks st ON t.id = st.task_id LEFT JOIN users u ON t.user_id = u.id WHERE t.id = $1 AND st.shared_with_id = $2',
        [taskId, userId]);
    return result.rows[0];
};

const updateSharedTask = async (taskId, taskData, userId) => {
    const checkPermission = await pool.query('SELECT permission_level FROM shared_tasks WHERE task_id = $1 AND shared_with_id = $2',
        [taskId, userId]);
    if (checkPermission.rows.length === 0 || checkPermission.rows[0].permission_level === 'read') {
        throw new Error('You do not have permission to update this task');
    }
    const { title, description, due_date, status, priority } = taskData;
    const result = await pool.query('UPDATE tasks SET title = $1, description = $2, due_date = $3, status = $4, priority = $5 WHERE id = $6 RETURNING *',
        [title, description, due_date, status, priority, taskId]);
    return result.rows[0];
};

const removedAccess = async (taskId, userId) => {
    const result = await pool.query('DELETE FROM shared_tasks WHERE task_id = $1 AND shared_with_id = $2 RETURNING *',
        [taskId, userId]);
    return result.rows[0];
};

const checkOwner = async (taskId, userId) => {
    const result = await pool.query('SELECT user_id FROM tasks WHERE id = $1', [taskId]);
    return result.rows[0].user_id === userId;
};

const checkShared = async (taskId, sharedWithId) => {
    const result = await pool.query('SELECT * FROM shared_tasks WHERE task_id = $1 AND shared_with_id = $2',
        [taskId, sharedWithId]);
    return result.rows.length > 0;
};

const updateTaskStatus = async (taskId, status, userId) => {
    const result = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [status, taskId, userId]);
    return result.rows[0];
};


module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    shareTask,
    getSharedTasks,
    updateSharedTask,
    removedAccess,
    checkOwner,
    getSharedTaskById,
    checkShared,
    updateTaskStatus
};