module.exports = function setupRtcHandlers(io, socket) {
  socket.on('sdp_offer', (data) => {
    const slug = socket.roomSlug;
    if (slug) {
      socket.to(slug).emit('sdp_offer', data);
    }
  });

  socket.on('sdp_answer', (data) => {
    const slug = socket.roomSlug;
    if (slug) {
      socket.to(slug).emit('sdp_answer', data);
    }
  });

  socket.on('ice_candidate', (data) => {
    const slug = socket.roomSlug;
    if (slug) {
      socket.to(slug).emit('ice_candidate', data);
    }
  });
};
