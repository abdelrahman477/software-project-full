const pool = require('./db');

const getNotificationsForUser = async (userId) => {
    const query = `
        SELECT 
            n.id,
            n.user_id,
            n.task_id,
            n.message,
            n.type,
            n.is_read,
            n.created_at,
            t.title as task_title,
            t.due_date
        FROM notifications n
        LEFT JOIN tasks t ON n.task_id = t.id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const markAllNotificationsAsRead = async (userId) => {
    const query = `
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return result.rowCount;
};

module.exports = {
    getNotificationsForUser,
    markAllNotificationsAsRead
};