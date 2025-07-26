// js/scripts.js
$(document).ready(function () {

    const API_BASE_URL = 'http://localhost:5000/api';

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        loadUserInfo();
        showLoggedInState();
    } else {
        showLoggedOutState();
    }

    // --- Login Form ---
    $('#loginForm').submit(function (e) {
        e.preventDefault();
        const username = $('#loginUsername').val().trim();
        const password = $('#loginPassword').val().trim();

        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }

        fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    loadUserInfo();
                    showLoggedInState();
                } else {
                    alert(data.error || 'Login failed');
                }
            })
            .catch(() => alert('Login failed: Network or server error'));
    });

    // --- Load User Info ---
    function loadUserInfo() {
        const token = localStorage.getItem('token');
        console.log(token);
        if (!token) return;

        fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.username) {
                    // Store user ID for edit functionality
                    localStorage.setItem('currentUserId', data.id);

                    // Update the welcome message
                    $('#usernameDisplay').text(data.username);

                    // Update all user information fields
                    $('#usernameInfo').text(data.username);
                    $('#emailInfo').text(data.email || 'Not provided');
                    $('#roleInfo').text(data.role || 'User');

                    // Format and display the created date
                    if (data.created_at) {
                        const createdDate = new Date(data.created_at);
                        const formattedDate = createdDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        $('#createdAtInfo').text(formattedDate);
                    } else {
                        $('#createdAtInfo').text('Unknown');
                    }

                    $('#userInfo').show();

                    if (data.role === 'admin') {
                        $('#adminPanel').show();
                    }
                }
            })
            .catch(() => {
                localStorage.removeItem('token');
                showLoggedOutState();
            });
    }

    // --- Show Logged In State ---
    function showLoggedInState() {
        $('#loginSection').hide();
        $('#userInfo').show();
        $('#editProfileSection').hide();
        $('#shirtsSection').show();
        loadShirts();
    }

    // --- Show Logged Out State ---
    function showLoggedOutState() {
        $('#loginSection').show();
        $('#userInfo').hide();
        $('#editProfileSection').hide();
        $('#shirtsSection').hide();
        $('#adminPanel').hide();
        $('#loginUsername').val('');
        $('#loginPassword').val('');
    }

    // --- Edit Profile Button ---
    $('#editProfileBtn').click(function () {
        // Populate the edit form with current user data
        $('#editUsername').val($('#usernameInfo').text());
        $('#editEmail').val($('#emailInfo').text());

        // Show edit form, hide user info
        $('#userInfo').hide();
        $('#editProfileSection').show();
    });

    // --- Cancel Edit Button ---
    $('#cancelEditBtn').click(function () {
        $('#editProfileSection').hide();
        $('#userInfo').show();
    });

    // --- Edit Profile Form Submit ---
    $('#editProfileForm').submit(function (e) {
        e.preventDefault();

        const username = $('#editUsername').val().trim();
        const email = $('#editEmail').val().trim();

        // Validation
        if (!username || !email) {
            alert('Please fill in all required fields');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        // Get current user ID from the profile data
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            alert('Unable to get user information');
            return;
        }

        // Send update request using existing updateUser endpoint
        fetch(`${API_BASE_URL}/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email })
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    alert('Profile updated successfully!');
                    // Reload user info to show updated data
                    loadUserInfo();
                    // Show user info, hide edit form
                    $('#editProfileSection').hide();
                    $('#userInfo').show();
                } else {
                    alert(data.error || 'Failed to update profile');
                }
            })
            .catch(() => alert('Failed to update profile: Network or server error'));
    });

    // --- Get Current User ID ---
    function getCurrentUserId() {
        // This is a simple way to store and retrieve the current user ID
        // In a real app, you might want to store this in localStorage or get it from the profile
        return localStorage.getItem('currentUserId');
    }

    // --- Logout ---
    $('#logoutBtn').click(function () {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUserId');

        // Redirect to login page
        window.location.href = 'index.html';
    });

    // --- Load Shirts (placeholder) ---
    function loadShirts() {
        // This is a placeholder - you can implement actual shirt loading here
        const shirtsContainer = $('#shirtsList');
        shirtsContainer.html('<div class="col-12"><p class="text-muted">No shirts available at the moment.</p></div>');
    }

    // --- Task Management Variables ---
    let currentTasks = [];
    let currentSharedTasks = [];
    let editingTaskId = null;
    let sharingTaskId = null;

    // --- Load Tasks ---
    function loadTasks() {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    currentTasks = data;
                    displayTasks(data);
                } else {
                    console.error('Invalid tasks data:', data);
                    displayTasks([]);
                }
            })
            .catch(error => {
                console.error('Error loading tasks:', error);
                displayTasks([]);
            });
    }

    // --- Display Tasks ---
    function displayTasks(tasks) {
        const tasksContainer = $('#tasksList');

        if (tasks.length === 0) {
            tasksContainer.html(`
                <div class="text-center py-4">
                    <i class="bi bi-list-task" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-2">No tasks available at the moment.</p>
                    <p class="text-muted">Click "Add New Task" to get started!</p>
                </div>
            `);
            return;
        }

        let tasksHtml = '<div class="row">';
        tasks.forEach(task => {
            const priorityClass = getPriorityClass(task.priority);
            const statusClass = getStatusClass(task.status);
            const dueDate = new Date(task.due_date);
            const isOverdue = dueDate < new Date() && task.status !== 'completed';

            tasksHtml += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 ${isOverdue ? 'border-danger' : ''}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                            <span class="badge ${statusClass}">${task.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${task.title}</h6>
                            <p class="card-text text-muted">${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="bi bi-calendar"></i> 
                                    ${dueDate.toLocaleDateString()}
                                </small>
                                <button class="btn btn-sm btn-outline-primary view-task-btn" data-task-id="${task.id}">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        tasksHtml += '</div>';

        tasksContainer.html(tasksHtml);
    }

    // --- Get Priority Class ---
    function getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning';
            case 'low': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    // --- Get Status Class ---
    function getStatusClass(status) {
        switch (status) {
            case 'completed': return 'bg-success';
            case 'in_progress': return 'bg-primary';
            case 'pending': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }

    // --- Add Task Button ---
    $('#addTaskBtn').click(function () {
        editingTaskId = null;
        $('#taskModalTitle').text('Add New Task');
        $('#taskForm')[0].reset();
        $('#taskDueDate').val(new Date().toISOString().slice(0, 16));
        $('#taskModal').modal('show');
    });

    // --- Save Task Button ---
    $('#saveTaskBtn').click(function () {
        const taskData = {
            title: $('#taskTitle').val().trim(),
            description: $('#taskDescription').val().trim(),
            due_date: $('#taskDueDate').val(),
            status: $('#taskStatus').val(),
            priority: $('#taskPriority').val()
        };

        // Validation
        if (!taskData.title || !taskData.description || !taskData.due_date || !taskData.status || !taskData.priority) {
            alert('Please fill in all required fields');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        const url = editingTaskId ?
            `${API_BASE_URL}/tasks/${editingTaskId}` :
            `${API_BASE_URL}/tasks`;

        const method = editingTaskId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    alert(editingTaskId ? 'Task updated successfully!' : 'Task created successfully!');
                    $('#taskModal').modal('hide');
                    loadTasks();
                } else {
                    alert(data.error || 'Failed to save task');
                }
            })
            .catch(() => alert('Failed to save task: Network or server error'));
    });

    // --- View Task Details ---
    $(document).on('click', '.view-task-btn', function () {
        const taskId = $(this).data('task-id');
        const task = currentTasks.find(t => t.id == taskId);

        if (task) {
            displayTaskDetails(task);
            $('#taskDetailsModal').modal('show');
        }
    });

    // --- Display Task Details ---
    function displayTaskDetails(task) {
        const dueDate = new Date(task.due_date);
        const priorityClass = getPriorityClass(task.priority);
        const statusClass = getStatusClass(task.status);

        const detailsHtml = `
            <div class="row">
                <div class="col-md-8">
                    <h5>${task.title}</h5>
                    <p class="text-muted">${task.description}</p>
                </div>
                <div class="col-md-4">
                    <div class="mb-2">
                        <strong>Priority:</strong> 
                        <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Status:</strong> 
                        <span class="badge ${statusClass}">${task.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Due Date:</strong><br>
                        <small class="text-muted">${dueDate.toLocaleString()}</small>
                    </div>
                    <div class="mb-2">
                        <strong>Created:</strong><br>
                        <small class="text-muted">${new Date(task.created_at).toLocaleString()}</small>
                    </div>
                </div>
            </div>
        `;

        $('#taskDetailsContent').html(detailsHtml);

        // Store current task ID for edit/delete/share operations
        $('#editTaskBtn').data('task-id', task.id);
        $('#deleteTaskBtn').data('task-id', task.id);
        $('#shareTaskBtn').data('task-id', task.id);

        // Show appropriate buttons for personal tasks
        $('#editTaskBtn').show();
        $('#deleteTaskBtn').show();
        $('#shareTaskBtn').show();
        $('#removeAccessBtn').hide();
    }

    // --- Edit Task Button ---
    $('#editTaskBtn').click(function () {
        const taskId = $(this).data('task-id');
        const task = currentTasks.find(t => t.id == taskId);

        if (task) {
            editingTaskId = taskId;
            $('#taskModalTitle').text('Edit Task');
            $('#taskTitle').val(task.title);
            $('#taskDescription').val(task.description);
            $('#taskDueDate').val(task.due_date.slice(0, 16));
            $('#taskStatus').val(task.status);
            $('#taskPriority').val(task.priority);

            $('#taskDetailsModal').modal('hide');
            $('#taskModal').modal('show');
        }
    });

    // --- Delete Task Button ---
    $('#deleteTaskBtn').click(function () {
        const taskId = $(this).data('task-id');

        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in again');
                return;
            }

            fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.message) {
                        alert('Task deleted successfully!');
                        $('#taskDetailsModal').modal('hide');
                        loadTasks();
                    } else {
                        alert(data.error || 'Failed to delete task');
                    }
                })
                .catch(() => alert('Failed to delete task: Network or server error'));
        }
    });

    // --- Load Shared Tasks ---
    function loadSharedTasks() {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_BASE_URL}/shared-tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    currentSharedTasks = data;
                    displaySharedTasks(data);
                } else {
                    console.error('Invalid shared tasks data:', data);
                    displaySharedTasks([]);
                }
            })
            .catch(error => {
                console.error('Error loading shared tasks:', error);
                displaySharedTasks([]);
            });
    }

    // --- Display Shared Tasks ---
    function displaySharedTasks(tasks) {
        const tasksContainer = $('#sharedTasksList');

        if (tasks.length === 0) {
            tasksContainer.html(`
                <div class="text-center py-4">
                    <i class="bi bi-share" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-2">No shared tasks available.</p>
                </div>
            `);
            return;
        }

        let tasksHtml = '<div class="row">';
        tasks.forEach(task => {
            const priorityClass = getPriorityClass(task.priority);
            const statusClass = getStatusClass(task.status);
            const dueDate = new Date(task.due_date);
            const isOverdue = dueDate < new Date() && task.status !== 'completed';
            const permissionClass = task.permission_level === 'write' ? 'bg-warning' : 'bg-info';

            tasksHtml += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 ${isOverdue ? 'border-danger' : ''}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                            <span class="badge ${statusClass}">${task.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${task.title}</h6>
                            <p class="card-text text-muted">${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</p>
                            <div class="mb-2">
                                <small class="text-muted">
                                    <strong>Owner:</strong> ${task.owner_name || 'Unknown'}
                                </small>
                            </div>
                            <div class="mb-2">
                                <span class="badge ${permissionClass}">
                                    ${task.permission_level === 'write' ? 'Read & Write' : 'Read Only'}
                                </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="bi bi-calendar"></i> 
                                    ${dueDate.toLocaleDateString()}
                                </small>
                                <div>
                                    <button class="btn btn-sm btn-outline-primary view-shared-task-btn me-1" data-task-id="${task.id}">
                                        View
                                    </button>
                                    ${task.permission_level === 'write' ?
                    `<button class="btn btn-sm btn-outline-warning edit-shared-task-btn" data-task-id="${task.id}">Edit</button>` :
                    ''
                }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        tasksHtml += '</div>';

        tasksContainer.html(tasksHtml);
    }

    // --- Share Task Button ---
    $('#shareTaskBtn').click(function () {
        const taskId = $(this).data('task-id');
        sharingTaskId = taskId;
        $('#shareTaskForm')[0].reset();
        $('#shareTaskModal').modal('show');
    });

    // --- Confirm Share Button ---
    $('#confirmShareBtn').click(function () {
        const sharedWithId = $('#shareUserId').val().trim();
        const permissionLevel = $('#sharePermission').val();

        if (!sharedWithId) {
            alert('Please enter a user ID');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        fetch(`${API_BASE_URL}/tasks/${sharingTaskId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sharedWithId: parseInt(sharedWithId),
                permissionLevel: permissionLevel
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    alert('Task shared successfully!');
                    $('#shareTaskModal').modal('hide');
                    loadSharedTasks(); // Refresh shared tasks list
                } else {
                    alert(data.error || 'Failed to share task');
                }
            })
            .catch(() => alert('Failed to share task: Network or server error'));
    });

    // --- View Shared Task Details ---
    $(document).on('click', '.view-shared-task-btn', function () {
        const taskId = $(this).data('task-id');
        const task = currentSharedTasks.find(t => t.id == taskId);

        if (task) {
            displaySharedTaskDetails(task);
            $('#taskDetailsModal').modal('show');
        }
    });

    // --- Display Shared Task Details ---
    function displaySharedTaskDetails(task) {
        const dueDate = new Date(task.due_date);
        const priorityClass = getPriorityClass(task.priority);
        const statusClass = getStatusClass(task.status);
        const permissionClass = task.permission_level === 'write' ? 'bg-warning' : 'bg-info';

        const detailsHtml = `
            <div class="row">
                <div class="col-md-8">
                    <h5>${task.title}</h5>
                    <p class="text-muted">${task.description}</p>
                </div>
                <div class="col-md-4">
                    <div class="mb-2">
                        <strong>Owner:</strong> 
                        <span>${task.owner_name || 'Unknown'}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Your Permission:</strong> 
                        <span class="badge ${permissionClass}">${task.permission_level === 'write' ? 'Read & Write' : 'Read Only'}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Priority:</strong> 
                        <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Status:</strong> 
                        <span class="badge ${statusClass}">${task.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Due Date:</strong><br>
                        <small class="text-muted">${dueDate.toLocaleString()}</small>
                    </div>
                    <div class="mb-2">
                        <strong>Shared On:</strong><br>
                        <small class="text-muted">${new Date(task.shared_at).toLocaleString()}</small>
                    </div>
                </div>
            </div>
        `;

        $('#taskDetailsContent').html(detailsHtml);

        // Update modal buttons for shared task
        $('#editTaskBtn').hide();
        $('#deleteTaskBtn').hide();
        $('#shareTaskBtn').hide();
        $('#removeAccessBtn').show();

        if (task.permission_level === 'write') {
            $('#editTaskBtn').show().data('task-id', task.id);
        }

        // Add remove access button for shared tasks if it doesn't exist
        if (!$('#removeAccessBtn').length) {
            $('#taskDetailsModal .modal-footer').append('<button type="button" class="btn btn-warning" id="removeAccessBtn">Remove Access</button>');
        }
        $('#removeAccessBtn').data('task-id', task.id);
    }

    // --- Remove Shared Task Access ---
    $(document).on('click', '#removeAccessBtn', function () {
        const taskId = $(this).data('task-id');

        if (confirm('Are you sure you want to remove access to this shared task?')) {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in again');
                return;
            }

            fetch(`${API_BASE_URL}/shared-tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.message) {
                        alert('Access removed successfully!');
                        $('#taskDetailsModal').modal('hide');
                        loadSharedTasks();
                    } else {
                        alert(data.error || 'Failed to remove access');
                    }
                })
                .catch(() => alert('Failed to remove access: Network or server error'));
        }
    });

    // --- Edit Shared Task Button ---
    $(document).on('click', '.edit-shared-task-btn', function () {
        const taskId = $(this).data('task-id');
        const task = currentSharedTasks.find(t => t.id == taskId);

        if (task && task.permission_level === 'write') {
            editingTaskId = taskId;
            $('#taskModalTitle').text('Edit Shared Task');
            $('#taskTitle').val(task.title);
            $('#taskDescription').val(task.description);
            $('#taskDueDate').val(task.due_date.slice(0, 16));
            $('#taskStatus').val(task.status);
            $('#taskPriority').val(task.priority);

            $('#taskModal').modal('show');
        }
    });

    // --- Load tasks when on tasks page ---
    if (window.location.pathname.includes('tasks.html')) {
        loadTasks();
        loadSharedTasks();
    }
});