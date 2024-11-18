document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const loginForm = document.getElementById('login-form');
    const createAccountForm = document.getElementById('create-account-form');
    const showLoginButton = document.getElementById('show-login');
    const showCreateAccountButton = document.getElementById('show-create-account');

    showLoginButton.addEventListener('click', () => {
        loginForm.classList.add('active');
        createAccountForm.classList.remove('active');
    });

    showCreateAccountButton.addEventListener('click', () => {
        createAccountForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    const loggedInUser = localStorage.getItem('loggedInUser');
    const loggedInPassword = localStorage.getItem('loggedInPassword');
    if (loggedInUser && loggedInPassword) {
        login(loggedInUser, loggedInPassword);
    }

    document.getElementById('create-account-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;

        createAccount(username, password);
    });

    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        login(username, password);
    });

    function createAccount(username, password) {
        fetch('/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Account created successfully!') {
                localStorage.setItem('token', data.token);
                console.log("Created account: ", data.token);
                localStorage.setItem('loggedInUser', username);
                localStorage.setItem('loggedInPassword', password);
                window.location.href = '../home/home.html';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    function login(username, password) {
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login successful!') {
                localStorage.setItem('token', data.token);
                console.log("Logged in: ", data.token);
                localStorage.setItem('loggedInUser', username);
                localStorage.setItem('loggedInPassword', password);
                window.location.href = '../home/home.html';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});