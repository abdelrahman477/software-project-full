const { getAllUsers, getUserById, updateUserById } = require('../models/userModel');


const getCurrentUserProfile = async (req, res) => {
    try {
        // Get the user ID from the JWT token
        console.log(req.user);
        console.log(req.user.userId);

        // Fetch the complete user profile from the database
        const userProfile = await getUserById(req.user.userId);

        if (!userProfile) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(userProfile);

        res.json(userProfile);
    } catch (error) {
        console.error('Error fetching current user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = req.params.id;
        const result = await getUserById(user);
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Access is denied for your role.' });
        }
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;
        const result = await updateUserById(id, { username, email, role });
        res.json(result);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports = { getCurrentUserProfile, getUserProfile, getUsers, updateUser };