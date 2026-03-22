const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db/index');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const questionsRoutes = require('./routes/questions');
const setupRoomHandlers = require('./socket/roomHandlers');
const setupRtcHandlers = require('./socket/rtcHandlers');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Protect other routes
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.use('/api/rooms', roomsRoutes);
app.use('/api/questions', questionsRoutes);

// Static files for frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve index.html for unknown routes (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (${socket.user.role})`);
  setupRoomHandlers(io, socket, db);
  setupRtcHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
