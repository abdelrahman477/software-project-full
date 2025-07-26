// index.js (Confirm this structure)

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Ensure this is imported
const taskRoutes = require('./routes/taskRoutes'); // Ensure this is imported
const sharedTasksRoutes = require('./routes/shared-TasksRoutes'); // Ensure this is imported
const notificationsRoutes = require('./routes/notificationsRoutes'); // Ensure this is imported
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS setup to allow requests from your frontend
app.use(cors()); // Uses the ORIGIN from .env

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount the route handlers
app.use('/api', authRoutes);
app.use('/api/users', userRoutes); // Mount user routes
app.use('/api/tasks', taskRoutes); // Mount task routes
app.use('/api/shared-tasks', sharedTasksRoutes); // Mount shared tasks routes
app.use('/api/notifications', notificationsRoutes); // Mount notifications routes

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
