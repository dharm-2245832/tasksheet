import { io } from 'socket.io-client';

let socket;

export const initiateSocketConnection = (token) => {
  socket = io(window.location.origin, {
    auth: {
      token
    }
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const getSocket = () => {
  return socket;
};
