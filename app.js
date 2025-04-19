// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const logoutButton = document.getElementById('logout-button');
const usernameDisplay = document.getElementById('username-display');
const profilePic = document.getElementById('profile-pic');

// Login Elements
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

// Register Elements
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const confirmPassword = document.getElementById('confirm-password');
const registerPicture = document.getElementById('register-picture');
const registerError = document.getElementById('register-error');

// Chat Elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const photoButton = document.getElementById('photo-button');
const stickerButton = document.getElementById('sticker-button');
const stickerSelector = document.getElementById('sticker-selector');
const photoInput = document.getElementById('photo-input');

// Google Apps Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvy0_jhv77a-BU8FkwbH7E15XRyCmmTExpm0Ml3qSqu2cHFd9J-G6u8ydZjI_gwcH8/exec';

// Current User Data
let currentUser = null;

// Initialize the app
window.addEventListener('load', () => {
    checkAuthStatus();
    setupEventListeners();
});

function checkAuthStatus() {
    const userData = localStorage.getItem('chatUser');
    if (userData) {
        const user = JSON.parse(userData);
        verifySession(user.token, (valid) => {
            if (valid) {
                currentUser = user;
                showApp();
            } else {
                localStorage.removeItem('chatUser');
            }
        });
    }
}

function setupEventListeners() {
    // Auth Form Switchers
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginError.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        registerError.textContent = '';
    });

    // Login Button
    loginButton.addEventListener('click', handleLogin);

    // Register Button
    registerButton.addEventListener('click', handleRegister);

    // Logout Button
    logoutButton.addEventListener('click', handleLogout);

    // Chat Send Button
    sendButton.addEventListener('click', sendMessage);

    // Enter Key for Message Input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Photo Button
    photoButton.addEventListener('click', () => photoInput.click());

    // Photo Input Change
    photoInput.addEventListener('change', handlePhotoUpload);

    // Sticker Button
    stickerButton.addEventListener('click', toggleStickerSelector);

    // Sticker Selection
    document.querySelectorAll('.sticker-option').forEach(sticker => {
        sticker.addEventListener('click', () => {
            sendSticker(sticker.getAttribute('data-sticker'));
        });
    });
}

function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        loginError.textContent = 'කරුණාකර ඊමේල් සහ මුරපදය ඇතුළත් කරන්න';
        return;
    }

    loginError.textContent = '';

    fetch(`${SCRIPT_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = {
                    name: data.user.name,
                    email: data.user.email,
                    token: data.token,
                    picture: data.user.picture || 'default-profile.png'
                };
                localStorage.setItem('chatUser', JSON.stringify(currentUser));
                showApp();
            } else {
                loginError.textContent = data.message || 'ලොගින් වීමට අසමත් විය';
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            loginError.textContent = 'ලොගින් වීමේ දෝෂයක් ඇතිවිය';
        });
}

function handleRegister() {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirmPass = confirmPassword.value.trim();
    const pictureFile = registerPicture.files[0];

    // Validation
    if (!name || !email || !password || !confirmPass) {
        registerError.textContent = 'කරුණාකර සියලුම තොරතුරු පුරවන්න';
        return;
    }

    if (password !== confirmPass) {
        registerError.textContent = 'මුරපද ගැලපෙන්නේ නැත';
        return;
    }

    if (password.length < 6) {
        registerError.textContent = 'මුරපදය අවම අක්ෂර 6 ක් විය යුතුය';
        return;
    }

    registerError.textContent = '';

    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    if (pictureFile) {
        formData.append('picture', pictureFile);
    }

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            registerError.textContent = '';
            alert('ලියාපදිංචි වීම සාර්ථකයි! දැන් ඔබට ලොගින් විය හැකිය');
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            // Reset form
            registerName.value = '';
            registerEmail.value = '';
            registerPassword.value = '';
            confirmPassword.value = '';
            registerPicture.value = '';
        } else {
            registerError.textContent = data.message || 'ලියාපදිංචි වීමට අසමත් විය';
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        registerError.textContent = 'ලියාපදිංචි වීමේ දෝෂයක් ඇතිවිය';
    });
}

function handleLogout() {
    if (currentUser && currentUser.token) {
        fetch(`${SCRIPT_URL}?action=logout&token=${encodeURIComponent(currentUser.token)}`)
            .catch(error => console.error('Logout error:', error));
    }
    
    localStorage.removeItem('chatUser');
    currentUser = null;
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginEmail.value = '';
    loginPassword.value = '';
}

function verifySession(token, callback) {
    fetch(`${SCRIPT_URL}?action=verifyToken&token=${encodeURIComponent(token)}`)
        .then(response => response.json())
        .then(data => callback(data.valid))
        .catch(() => callback(false));
}

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    
    // Set user profile
    usernameDisplay.textContent = currentUser.name;
    profilePic.src = currentUser.picture || 'default-profile.png';
    
    // Load chat history
    loadChatHistory();
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    const messageData = {
        sender: currentUser.email,
        content: message,
        type: 'text',
        timestamp: new Date().toISOString()
    };

    // Add to chat immediately
    addMessageToChat(messageData, true);
    messageInput.value = '';

    // Save to server
    saveMessage(messageData);
}

function sendSticker(sticker) {
    const messageData = {
        sender: currentUser.email,
        content: sticker,
        type: 'sticker',
        timestamp: new Date().toISOString()
    };

    addMessageToChat(messageData, true);
    toggleStickerSelector();
    saveMessage(messageData);
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('පින්තූරය 2MB ට වඩා විශාල විය නොහැක');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const messageData = {
            sender: currentUser.email,
            content: event.target.result,
            type: 'image',
            timestamp: new Date().toISOString()
        };

        addMessageToChat(messageData, true);
        saveMessage(messageData);
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
}

function toggleStickerSelector() {
    stickerSelector.style.display = stickerSelector.style.display === 'block' ? 'none' : 'block';
}

function addMessageToChat(message, isCurrentUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isCurrentUser ? 'user-message' : 'other-message');

    // Message info (sender and time)
    const messageInfo = document.createElement('div');
    messageInfo.classList.add('message-info');

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('message-sender');
    senderSpan.textContent = isCurrentUser ? currentUser.name : message.senderName || 'අනෙක් පරිශීලකයා';

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('message-time');
    timeSpan.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageInfo.appendChild(senderSpan);
    messageInfo.appendChild(timeSpan);
    messageDiv.appendChild(messageInfo);

    // Message content
    const contentDiv = document.createElement('div');
    
    if (message.type === 'text') {
        contentDiv.textContent = message.content;
    } else if (message.type === 'image') {
        const img = document.createElement('img');
        img.src = message.content;
        img.classList.add('image-message');
        contentDiv.appendChild(img);
    } else if (message.type === 'sticker') {
        contentDiv.classList.add('sticker-message');
        contentDiv.textContent = message.content;
    }

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function saveMessage(message) {
    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'saveMessage',
            message: message,
            token: currentUser.token
        })
    }).catch(error => {
        console.error('Error saving message:', error);
    });
}

function loadChatHistory() {
    fetch(`${SCRIPT_URL}?action=getMessages&token=${encodeURIComponent(currentUser.token)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                data.messages.forEach(message => {
                    const isCurrentUser = message.sender === currentUser.email;
                    addMessageToChat(message, isCurrentUser);
                });
            }
        })
        .catch(error => {
            console.error('Error loading chat history:', error);
        });
}
