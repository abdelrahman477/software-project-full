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
    let currentTaskComments = [];
    let currentViewingTaskId = null;
    let currentNotifications = [];
    let currentUsers = [];
    let editingUserId = null;

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
            currentViewingTaskId = taskId;
            displayTaskDetails(task);
            loadTaskComments(taskId);
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
            currentViewingTaskId = taskId;
            displaySharedTaskDetails(task);
            loadTaskComments(taskId);
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

    // --- Load Task Comments ---
    function loadTaskComments(taskId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    currentTaskComments = data;
                    displayComments(data);
                } else {
                    console.error('Invalid comments data:', data);
                    displayComments([]);
                }
            })
            .catch(error => {
                console.error('Error loading comments:', error);
                displayComments([]);
            });
    }

    // --- Display Comments ---
    function displayComments(comments) {
        const commentsContainer = $('#commentsList');

        if (comments.length === 0) {
            commentsContainer.html('<p class="text-muted">No comments yet. Be the first to comment!</p>');
            return;
        }

        let commentsHtml = '';
        comments.forEach(comment => {
            const commentDate = new Date(comment.created_at);
            commentsHtml += `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <p class="mb-1">${comment.content}</p>
                                <small class="text-muted">
                                    <i class="bi bi-person"></i> ${comment.username || 'Unknown User'} | 
                                    <i class="bi bi-clock"></i> ${commentDate.toLocaleString()}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        commentsContainer.html(commentsHtml);
    }

    // --- Add Comment Form Submit ---
    $('#addCommentForm').submit(function (e) {
        e.preventDefault();

        const content = $('#commentContent').val().trim();
        if (!content) {
            alert('Please enter a comment');
            return;
        }

        if (!currentViewingTaskId) {
            alert('No task selected');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        fetch(`${API_BASE_URL}/tasks/${currentViewingTaskId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    $('#commentContent').val('');
                    loadTaskComments(currentViewingTaskId);
                    alert('Comment added successfully!');
                } else {
                    alert(data.error || 'Failed to add comment');
                }
            })
            .catch(() => alert('Failed to add comment: Network or server error'));
    });

    // --- Load Notifications ---
    function loadNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    currentNotifications = data;
                    updateNotificationBadge();
                    displayNotifications(data);
                } else {
                    console.error('Invalid notifications data:', data);
                    currentNotifications = [];
                    updateNotificationBadge();
                    displayNotifications([]);
                }
            })
            .catch(error => {
                console.error('Error loading notifications:', error);
                currentNotifications = [];
                updateNotificationBadge();
                displayNotifications([]);
            });
    }

    // --- Update Notification Badge ---
    function updateNotificationBadge() {
        const unreadCount = currentNotifications.filter(n => !n.is_read).length;
        const badge = $('#notificationBadge');

        if (unreadCount > 0) {
            badge.text(unreadCount).show();
        } else {
            badge.hide();
        }
    }

    // --- Display Notifications ---
    function displayNotifications(notifications) {
        const notificationsContainer = $('#notificationsList');

        if (notifications.length === 0) {
            notificationsContainer.html(`
                <div class="text-center py-4">
                    <i class="bi bi-bell-slash" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-2">No notifications available.</p>
                </div>
            `);
            return;
        }

        let notificationsHtml = '';
        notifications.forEach(notification => {
            const notificationDate = new Date(notification.created_at);
            const dueDate = notification.due_date ? new Date(notification.due_date) : null;
            const isUnread = !notification.is_read;

            notificationsHtml += `
                <div class="card mb-2 ${isUnread ? 'border-primary' : ''}">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1 ${isUnread ? 'fw-bold' : ''}">${notification.message}</h6>
                                ${notification.task_title ? `<p class="text-muted mb-1"><strong>Task:</strong> ${notification.task_title}</p>` : ''}
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        <i class="bi bi-clock"></i> ${notificationDate.toLocaleString()}
                                    </small>
                                    ${dueDate ? `<small class="text-muted"><i class="bi bi-calendar"></i> Due: ${dueDate.toLocaleDateString()}</small>` : ''}
                                </div>
                            </div>
                            ${isUnread ? '<span class="badge bg-primary ms-2">New</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        notificationsContainer.html(notificationsHtml);
    }

    // --- Notifications Button ---
    $('#notificationsBtn').click(function () {
        loadNotifications();
        $('#notificationsModal').modal('show');
    });

    // --- Mark All as Read Button ---
    $('#markAllReadBtn').click(function () {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        fetch(`${API_BASE_URL}/notifications/mark-read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    alert('All notifications marked as read!');
                    loadNotifications(); // Refresh notifications
                } else {
                    alert(data.error || 'Failed to mark notifications as read');
                }
            })
            .catch(() => alert('Failed to mark notifications as read: Network or server error'));
    });

    // --- Load notifications when logged in ---
    if (localStorage.getItem('token')) {
        loadNotifications();
    }

    // --- Filter Tasks ---
    function filterTasks() {
        const status = $('#filterStatus').val();
        const priority = $('#filterPriority').val();
        const dueDate = $('#filterDueDate').val();

        const token = localStorage.getItem('token');
        if (!token) return;

        // Build query parameters
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (dueDate) params.append('dueDate', dueDate);

        fetch(`${API_BASE_URL}/tasks/filter?${params.toString()}`, {
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
                    console.error('Invalid filtered tasks data:', data);
                    displayTasks([]);
                }
            })
            .catch(error => {
                console.error('Error filtering tasks:', error);
                displayTasks([]);
            });
    }

    // --- Sort Tasks ---
    function sortTasks() {
        const sortBy = $('#sortBy').val();
        const sortOrder = $('#sortOrder').val();

        const token = localStorage.getItem('token');
        if (!token) return;

        // Build query parameters
        const params = new URLSearchParams();
        params.append('sortBy', sortBy);
        params.append('order', sortOrder);

        fetch(`${API_BASE_URL}/tasks/sort?${params.toString()}`, {
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
                    console.error('Invalid sorted tasks data:', data);
                    displayTasks([]);
                }
            })
            .catch(error => {
                console.error('Error sorting tasks:', error);
                displayTasks([]);
            });
    }

    // --- Apply Filters Button ---
    $('#applyFiltersBtn').click(function () {
        filterTasks();
    });

    // --- Clear Filters Button ---
    $('#clearFiltersBtn').click(function () {
        $('#filterStatus').val('');
        $('#filterPriority').val('');
        $('#filterDueDate').val('');
        $('#sortBy').val('created_at');
        $('#sortOrder').val('desc');
        loadTasks(); // Load all tasks without filters
    });

    // --- Sort Change Event ---
    $('#sortBy, #sortOrder').change(function () {
        sortTasks();
    });

    // --- Load Users (Admin Only) ---
    function loadUsers() {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    currentUsers = data;
                    displayUsers(data);
                } else {
                    console.error('Invalid users data:', data);
                    if (data.error && data.error.includes('Forbidden')) {
                        alert('Access denied. Admin privileges required.');
                        window.location.href = 'index.html';
                    } else {
                        displayUsers([]);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading users:', error);
                displayUsers([]);
            });
    }

    // --- Display Users ---
    function displayUsers(users) {
        const usersContainer = $('#usersTableContainer');

        if (users.length === 0) {
            usersContainer.html(`
                <div class="text-center py-4">
                    <i class="bi bi-people" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-2">No users found.</p>
                </div>
            `);
            return;
        }

        let usersHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            const createdDate = new Date(user.created_at);
            const roleClass = user.role === 'admin' ? 'badge bg-danger' : 'badge bg-primary';

            usersHtml += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="${roleClass}">${user.role || 'user'}</span></td>
                    <td>${createdDate.toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-user-btn" data-user-id="${user.id}">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        });

        usersHtml += `
                    </tbody>
                </table>
            </div>
        `;

        usersContainer.html(usersHtml);
    }

    // --- Edit User Button ---
    $(document).on('click', '.edit-user-btn', function () {
        const userId = $(this).data('user-id');
        const user = currentUsers.find(u => u.id == userId);

        if (user) {
            editingUserId = userId;
            $('#editUserUsername').val(user.username);
            $('#editUserEmail').val(user.email);
            $('#editUserRole').val(user.role || 'user');
            $('#editUserModal').modal('show');
        }
    });

    // --- Save User Changes ---
    $('#saveUserBtn').click(function () {
        const username = $('#editUserUsername').val().trim();
        const email = $('#editUserEmail').val().trim();
        const role = $('#editUserRole').val();

        if (!username || !email) {
            alert('Please fill in all required fields');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        fetch(`${API_BASE_URL}/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email, role })
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    alert('User updated successfully!');
                    $('#editUserModal').modal('hide');
                    loadUsers(); // Refresh users list
                } else {
                    alert(data.error || 'Failed to update user');
                }
            })
            .catch(() => alert('Failed to update user: Network or server error'));
    });

    // --- Refresh Users Button ---
    $('#refreshUsersBtn').click(function () {
        loadUsers();
    });

    // --- Load admin panel when on admin page ---
    if (window.location.pathname.includes('admin.html')) {
        loadUsers();
    }

    // --- Load tasks when on tasks page ---
    if (window.location.pathname.includes('tasks.html')) {
        loadTasks();
        loadSharedTasks();
    }
});