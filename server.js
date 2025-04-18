require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Vercel-optimized Socket.IO configuration
const io = socketIo(server, {
  transports: ['websocket'],
  allowUpgrades: false,
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO Logic
const users = {};

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('register', (username) => {
    users[socket.id] = username;
    io.emit('user-list', Object.values(users));
    socket.broadcast.emit('message', {
      user: 'System',
      text: `${username} joined the chat`,
      type: 'notification'
    });
  });

  socket.on('message', (data) => {
    if (!users[socket.id]) return;
    
    const message = {
      user: users[socket.id],
      timestamp: new Date().toISOString(),
      ...data
    };
    
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      io.emit('user-list', Object.values(users));
      socket.broadcast.emit('message', {
        user: 'System',
        text: `${username} left the chat`,
        type: 'notification'
      });
    }
  });
});

// Vercel-specific export
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
