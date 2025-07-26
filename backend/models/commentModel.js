const pool = require('./db');

const getCommentsByTaskId = async (taskId) => {
    const result = await pool.query('SELECT * FROM comments WHERE task_id = $1', [taskId]);
    return result.rows;
};

const createComment = async (comment, userId, taskId) => {
    const { content } = comment;
    const result = await pool.query('INSERT INTO comments (content, user_id, task_id) VALUES ($1, $2, $3) RETURNING *',
        [content, userId, taskId]);
    return result.rows[0];
};

module.exports = {
    getCommentsByTaskId,
    createComment
};  