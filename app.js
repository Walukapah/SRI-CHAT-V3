// DOM අංග
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const photoButton = document.getElementById('photo-button');
const stickerButton = document.getElementById('sticker-button');
const stickerSelector = document.getElementById('sticker-selector');
const photoInput = document.getElementById('photo-input');
const usernameInput = document.getElementById('username-input');
const setUsernameButton = document.getElementById('set-username');

// ගෝලීය විචල්ය
let currentUser = 'නාමරහිත පරිශීලකයා';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwVexCvdiGh0PaTkvZq-RgFURJWYgftT6uTQnkzZPwhm0L0yhqM1thc2IusQom_QrN8/exec'; // ඔබගේ Google Apps Script URL එක මෙහි යොදන්න

// පරිශීලක නාමය සකසන්න
setUsernameButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        currentUser = username;
        usernameInput.disabled = true;
        setUsernameButton.disabled = true;
        messageInput.disabled = false;
        sendButton.disabled = false;
        addSystemMessage(`ඔබ "${currentUser}" ලෙස සම්බන්ධ වී ඇත`);
        saveToGoogleSheets(`පරිශීලකයා සම්බන්ධ විය: ${currentUser}`, 'system');
    }
});

// ස්ටිකර් තෝරන්න බොත්තම ක්ලික් කිරීම
stickerButton.addEventListener('click', () => {
    stickerSelector.style.display = stickerSelector.style.display === 'block' ? 'none' : 'block';
});

// ස්ටිකර් තෝරාගැනීම
document.querySelectorAll('.sticker-option').forEach(sticker => {
    sticker.addEventListener('click', () => {
        sendMessage(sticker.getAttribute('data-sticker'), 'sticker');
        stickerSelector.style.display = 'none';
    });
});

// පින්තූර බොත්තම ක්ලික් කිරීම
photoButton.addEventListener('click', () => {
    photoInput.click();
});

// පින්තූර තෝරාගැනීම
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // ගොනුවේ ප්රමාණය පරීක්ෂා කරන්න (2MB ට වඩා විශාල නොවේදැයි)
        if (file.size > 2 * 1024 * 1024) {
            addSystemMessage('පින්තූරය 2MB ට වඩා විශාල විය නොහැක');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            sendMessage(event.target.result, 'image');
        };
        reader.onerror = () => {
            addSystemMessage('පින්තූරය පූරණය කිරීමේ දෝෂයක්');
        };
        reader.readAsDataURL(file);
    }
    photoInput.value = ''; // එකම ගොනුව නැවත තෝරා ගත හැකි වන පරිදි
});

// පණිවුඩය යැවීම (Enter යතුර හෝ යවන්න බොත්තම)
sendButton.addEventListener('click', sendTextMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendTextMessage();
    }
});

// පාඨ පණිවුඩය යැවීම
function sendTextMessage() {
    const message = messageInput.value.trim();
    if (message) {
        sendMessage(message, 'text');
        messageInput.value = '';
    }
}

// පණිවුඩය යැවීම සහ Google Sheets වෙත සුරැකීම
function sendMessage(content, type) {
    // චැට් වෙත පණිවුඩය එක් කිරීම
    addMessageToChat(content, type, 'user');
    
    // Google Sheets වෙත පණිවුඩය සුරැකීම
    saveToGoogleSheets(content, type);
}

// පද්ධති පණිවුඩයක් එක් කිරීම
function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add('system-message');
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// චැට් වෙත පණිවුඩය එක් කිරීම
function addMessageToChat(content, type, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'other-message');
    
    // පණිවුඩ තොරතුරු (යැව්වා, කාලය)
    const messageInfo = document.createElement('div');
    messageInfo.classList.add('message-info');
    
    const senderSpan = document.createElement('span');
    senderSpan.classList.add('message-sender');
    senderSpan.textContent = sender === 'user' ? currentUser : 'අනෙක් පරිශීලකයා';
    
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('message-time');
    timeSpan.textContent = new Date().toLocaleTimeString();
    
    messageInfo.appendChild(senderSpan);
    messageInfo.appendChild(timeSpan);
    messageDiv.appendChild(messageInfo);
    
    // පණිවුඩ අන්තර්ගතය
    const contentDiv = document.createElement('div');
    
    if (type === 'text') {
        contentDiv.textContent = content;
    } else if (type === 'image') {
        const img = document.createElement('img');
        img.src = content;
        img.classList.add('image-message');
        contentDiv.appendChild(img);
    } else if (type === 'sticker') {
        contentDiv.classList.add('sticker-message');
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Google Sheets වෙත පණිවුඩය සුරැකීම
function saveToGoogleSheets(content, type) {
    const data = {
        content: content,
        type: type,
        sender: currentUser,
        timestamp: new Date().toISOString()
    };
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(error => {
        console.error('Error:', error);
        addSystemMessage('පණිවුඩය සුරැකීමේ දෝෂයක්. අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න.');
    });
}

// පිටුව පූරණය වූ විට පැරණි චැට් ඉතිහාසය පූරණය කිරීම
window.addEventListener('load', () => {
    loadChatHistory();
});

// Google Sheets වෙතින් චැට් ඉතිහාසය පූරණය කිරීම
function loadChatHistory() {
    fetch(`${SCRIPT_URL}?action=getMessages`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            data.forEach(message => {
                addMessageToChat(message.content, message.type, message.sender === currentUser ? 'user' : 'other');
            });
        })
        .catch(error => {
            console.error('Error loading chat history:', error);
            addSystemMessage('චැට් ඉතිහාසය පූරණය කිරීමේ දෝෂයක්');
        });
                        }
