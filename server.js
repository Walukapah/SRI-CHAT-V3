require('dotenv').config();
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./google-creds.json');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Google Sheet initialization
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

async function initGoogleSheet() {
  try {
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    
    let sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Chat History', headerValues: ['timestamp', 'user', 'type', 'text', 'image'] });
    } else if (sheet.headerValues.length < 5) {
      await sheet.setHeaderRow(['timestamp', 'user', 'type', 'text', 'image']);
    }
    
    console.log(`Connected to Google Sheet: ${doc.title}`);
    return sheet;
  } catch (err) {
    console.error('Google Sheet initialization error:', err);
    throw err;
  }
}

// Chat message handling
async function handleChatMessage(sheet, message) {
  try {
    await sheet.addRow({
      timestamp: message.timestamp,
      user: message.user,
      type: message.type,
      text: message.text || '',
      image: message.image || ''
    });

    // Maintain only the last 1000 messages
    const rows = await sheet.getRows();
    if (rows.length > 1000) {
      await sheet.deleteRows(0, rows.length - 1000);
    }
  } catch (err) {
    console.error('Error saving message:', err);
  }
}

// Initialize and start server
initGoogleSheet().then(sheet => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Socket.io setup
  const io = require('socket.io')(server, {
    transports: ['websocket'],
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io events
  io.on('connection', async (socket) => {
    console.log('New user connected:', socket.id);

    // Load and send chat history
    const rows = await sheet.getRows();
    const history = rows.map(row => ({
      timestamp: row.timestamp,
      user: row.user,
      type: row.type,
      text: row.text,
      image: row.image
    }));
    
    socket.emit('load-history', history);

    // Handle new messages
    socket.on('message', async (data) => {
      const message = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      await handleChatMessage(sheet, message);
      io.emit('message', message);
    });
  });

  // API endpoint to get chat history
  app.get('/api/history', async (req, res) => {
    try {
      const rows = await sheet.getRows();
      const history = rows.map(row => ({
        timestamp: row.timestamp,
        user: row.user,
        type: row.type,
        text: row.text,
        image: row.image
      }));
      res.json(history);
    } catch (err) {
      console.error('Error fetching history:', err);
      res.status(500).json({ error: 'Failed to load chat history' });
    }
  });
}).catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});

module.exports = app;
