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
        $('#shirtsSection').show();
        loadShirts();
    }

    // --- Show Logged Out State ---
    function showLoggedOutState() {
        $('#loginSection').show();
        $('#userInfo').hide();
        $('#shirtsSection').hide();
        $('#adminPanel').hide();
        $('#loginUsername').val('');
        $('#loginPassword').val('');
    }

    // --- Logout ---
    $('#logoutBtn').click(function () {
        localStorage.removeItem('token');
        showLoggedOutState();
    });

    // --- Load Shirts (placeholder) ---
    function loadShirts() {
        // This is a placeholder - you can implement actual shirt loading here
        const shirtsContainer = $('#shirtsList');
        shirtsContainer.html('<div class="col-12"><p class="text-muted">No shirts available at the moment.</p></div>');
    }
});