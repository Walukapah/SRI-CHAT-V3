// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ස්ථිතික ගොනු සේවාදායකය
app.use(express.static(path.join(__dirname, 'public')));

let users = {};

io.on('connection', (socket) => {
    console.log('නව පරිශීලකයෙක් සම්බන්ධ විය:', socket.id);
    
    // පරිශීලකයා ලියාපදිංචි කිරීම
    socket.on('register', (username) => {
        users[socket.id] = username;
        io.emit('user-list', Object.values(users));
        socket.broadcast.emit('message', {
            user: 'පද්ධතිය',
            text: `${username} චැට් කාමරයට සම්බන්ධ විය`,
            type: 'notification'
        });
    });
    
    // පණිවිඩ ලබා ගැනීම
    socket.on('message', (data) => {
        if (data.type === 'text') {
            io.emit('message', {
                user: users[socket.id],
                text: data.text,
                type: 'text'
            });
        } else if (data.type === 'image') {
            io.emit('message', {
                user: users[socket.id],
                image: data.image,
                type: 'image'
            });
        }
    });
    
    // වීඩියෝ චැට් සංඥා
    socket.on('video-offer', (offer, to) => {
        socket.to(to).emit('video-offer', offer, socket.id);
    });
    
    socket.on('video-answer', (answer, to) => {
        socket.to(to).emit('video-answer', answer);
    });
    
    socket.on('ice-candidate', (candidate, to) => {
        socket.to(to).emit('ice-candidate', candidate);
    });
    
    // සම්බන්ධතාවය අහිමි වූ විට
    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            io.emit('user-list', Object.values(users));
            socket.broadcast.emit('message', {
                user: 'පද්ධතිය',
                text: `${username} චැට් කාමරය හැර ගියා`,
                type: 'notification'
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`සර්වරය ${PORT} වෙත සවි කර ඇත`);
});
