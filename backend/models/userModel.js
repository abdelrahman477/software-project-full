const pool = require('./db');

async function findUserByUsername(username) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0];
}

async function createUser({ username, email, password_hash, role = 'user' }) {
    const res = await pool.query(
        `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *`,
        [username, email, password_hash, role]
    );
    return res.rows[0];
}

async function getUserById(id) {
    const res = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0];
}

async function getAllUsers() {
    const res = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id');
    return res.rows;
}

async function updateUserById(id, { username, email, role }) {
    const res = await pool.query('UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING *', [username, email, role, id]);
    return res.rows[0];
}

module.exports = { findUserByUsername, createUser, getUserById, getAllUsers, updateUserById };
