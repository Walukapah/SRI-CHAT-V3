// public/app.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const photoButton = document.getElementById('photo-button');
    const videoButton = document.getElementById('video-button');
    const fileInput = document.getElementById('file-input');
    const messagesDiv = document.getElementById('messages');
    const usersDiv = document.getElementById('users');
    
    let localStream;
    let peerConnection;
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    
    // පරිශීලක නාමය ඇතුළත් කිරීම
    const username = prompt('ඔබගේ නම ඇතුළත් කරන්න:');
    socket.emit('register', username);
    
    // පරිශීලක ලැයිස්තුව යාවත්කාලීන කිරීම
    socket.on('user-list', (users) => {
        usersDiv.innerHTML = '<h3>පරිශීලකයන්</h3><ul>' + 
            users.map(user => `<li>${user}</li>`).join('') + '</ul>';
    });
    
    // පණිවිඩ පෙන්වීම
    socket.on('message', (data) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        if (data.type === 'notification') {
            messageDiv.innerHTML = `<em>${data.text}</em>`;
            messageDiv.style.backgroundColor = '#f0f0f0';
        } else if (data.type === 'text') {
            messageDiv.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;
        } else if (data.type === 'image') {
            messageDiv.innerHTML = `
                <strong>${data.user}:</strong> 
                <img src="${data.image}" alt="පින්තූරය">
            `;
        }
        
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
    
    // පණිවිඩ යැවීම
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            socket.emit('message', { type: 'text', text });
            messageInput.value = '';
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // පින්තූර යැවීම
    photoButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                socket.emit('message', { 
                    type: 'image', 
                    image: event.target.result 
                });
            };
            reader.readAsDataURL(file);
        }
    });
    
    // වීඩියෝ චැට්
    videoButton.addEventListener('click', async () => {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            // වීඩියෝ චැට් කවුළුව ඇරයුම් කරන්න
            const userList = Array.from(usersDiv.querySelectorAll('li'));
            const selectedUser = prompt(
                'කා සමඟ වීඩියෝ චැට් කරන්න අවශ්යද?\n' + 
                userList.map((li, i) => `${i+1}. ${li.textContent}`).join('\n')
            );
            
            if (selectedUser) {
                const userIndex = parseInt(selectedUser) - 1;
                if (userIndex >= 0 && userIndex < userList.length) {
                    startVideoChat(userList[userIndex].textContent);
                }
            }
        } catch (err) {
            console.error('වීඩියෝ අවසර ලබා ගැනීමේ දෝෂය:', err);
            alert('වීඩියෝ අවසර ලබා ගැනීමට අසමත් විය');
        }
    });
    
    // වීඩියෝ චැට් ආරම්භ කිරීම
    function startVideoChat(targetUser) {
        peerConnection = new RTCPeerConnection(configuration);
        
        // ICE candidate එකතු කිරීම
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate, targetUser);
            }
        };
        
        // දුරස්ථ ප්රවාහය ලැබුණු විට
        peerConnection.ontrack = (event) => {
            const video = document.createElement('video');
            video.srcObject = event.streams[0];
            video.autoplay = true;
            video.controls = true;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `<strong>${targetUser}:</strong>`;
            messageDiv.appendChild(video);
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        };
        
        // දේශීය ප්රවාහය එක් කිරීම
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Offer සාදා යැවීම
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                socket.emit('video-offer', peerConnection.localDescription, targetUser);
            })
            .catch(console.error);
    }
    
    // වීඩියෝ චැට් ඇමතුම් ලබා ගැනීම
    socket.on('video-offer', async (offer, from) => {
        if (confirm(`${from} වීඩියෝ චැට් ඇමතුමක් එවා ඇත. පිළිගන්නවාද?`)) {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                
                peerConnection = new RTCPeerConnection(configuration);
                
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', event.candidate, from);
                    }
                };
                
                peerConnection.ontrack = (event) => {
                    const video = document.createElement('video');
                    video.srcObject = event.streams[0];
                    video.autoplay = true;
                    video.controls = true;
                    
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.innerHTML = `<strong>${from}:</strong>`;
                    messageDiv.appendChild(video);
                    
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                };
                
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
                
                await peerConnection.setRemoteDescription(offer);
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                
                socket.emit('video-answer', answer, from);
            } catch (err) {
                console.error('වීඩියෝ චැට් පිළිගැනීමේ දෝෂය:', err);
            }
        }
    });
    
    // පිළිතුරු ලබා ගැනීම
    socket.on('video-answer', (answer) => {
        if (peerConnection) {
            peerConnection.setRemoteDescription(answer)
                .catch(console.error);
        }
    });
    
    // ICE candidate ලබා ගැනීම
    socket.on('ice-candidate', (candidate) => {
        if (peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(console.error);
        }
    });
});
