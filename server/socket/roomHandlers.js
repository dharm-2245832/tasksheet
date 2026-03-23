const runCode = require('../executor/runner');

const roomStates = new Map();

module.exports = function setupRoomHandlers(io, socket, db) {
  socket.on('join_room', (data) => {
    const { slug } = data;
    if (!slug) return socket.emit('error', 'Missing room slug');

    const stmt = db.prepare('SELECT * FROM rooms WHERE slug = ?');
    const room = stmt.get(slug);

    if (!room) return socket.emit('error', 'Room not found');
    if (room.status === 'ended') return socket.emit('room_ended');

    socket.join(slug);
    socket.roomSlug = slug;

    // Initialize state if not present
    if (!roomStates.has(slug)) {
      roomStates.set(slug, {
        code: '',
        language: room.language || 'javascript',
        participants: new Set()
      });
    }

    const state = roomStates.get(slug);
    state.participants.add(socket.id);

    // Broadcast room_joined to self
    socket.emit('room_joined', {
      code: state.code,
      language: state.language,
      participants: Array.from(state.participants)
    });

    // Notify others
    socket.to(slug).emit('participant_join', socket.id);
  });

  socket.on('code_change', (data) => {
    const { code } = data;
    const slug = socket.roomSlug;
    if (slug && roomStates.has(slug)) {
      roomStates.get(slug).code = code;
      socket.to(slug).emit('code_update', code);
    }
  });

  socket.on('language_change', (data) => {
    const { language } = data;
    const slug = socket.roomSlug;
    if (slug && roomStates.has(slug)) {
      roomStates.get(slug).language = language;
      socket.to(slug).emit('language_update', language);
    }
  });

  socket.on('run_code', async () => {
    const slug = socket.roomSlug;
    if (slug && roomStates.has(slug)) {
      const state = roomStates.get(slug);
      const result = await runCode(state.language, state.code);
      io.to(slug).emit('run_result', result);
    }
  });

  socket.on('end_session', (data) => {
    const { notes } = data;
    const slug = socket.roomSlug;

    if (socket.user.role !== 'interviewer') {
      return socket.emit('error', 'Only interviewers can end the session');
    }

    if (slug && roomStates.has(slug)) {
      const state = roomStates.get(slug);
      const stmtRoom = db.prepare('SELECT * FROM rooms WHERE slug = ?');
      const room = stmtRoom.get(slug);

      if (room) {
        // Save session
        const stmtSession = db.prepare('INSERT INTO sessions (room_id, code_snapshot, notes, ended_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
        stmtSession.run(room.id, state.code, notes || '');

        // Update room
        const stmtUpdateRoom = db.prepare('UPDATE rooms SET status = ? WHERE slug = ?');
        stmtUpdateRoom.run('ended', slug);

        io.to(slug).emit('room_ended');
        roomStates.delete(slug);
      }
    }
  });

  socket.on('disconnect', () => {
    const slug = socket.roomSlug;
    if (slug && roomStates.has(slug)) {
      const state = roomStates.get(slug);
      state.participants.delete(socket.id);
      io.to(slug).emit('participant_leave', socket.id);
    }
  });
};
