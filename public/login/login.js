document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const loginForm = document.getElementById('login-form');
    const createAccountForm = document.getElementById('create-account-form');
    const showLoginButton = document.getElementById('show-login');
    const showCreateAccountButton = document.getElementById('show-create-account');

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        window.location.href = '../home/home.html';
    }

    showLoginButton.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        createAccountForm.classList.add('hidden');
    });

    showCreateAccountButton.addEventListener('click', () => {
        createAccountForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

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
        fetch('http://localhost:3000/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Account created successfully!') {
                localStorage.setItem('loggedInUser', username);
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
        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login successful!') {
                localStorage.setItem('loggedInUser', username);
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