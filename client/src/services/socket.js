import { io } from 'socket.io-client';

// In development, Vite runs on port 3000, and Express runs on port 5000.
// So we point socket connection to localhost:5001 in dev, otherwise window.location.origin.
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5001' : window.location.origin;

let socket = null;

export const initiateSocketConnection = (interviewId) => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(SOCKET_URL);
  console.log('Connecting socket server...');

  if (interviewId) {
    socket.emit('join_interview', interviewId);
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket server...');
    socket.disconnect();
    socket = null;
  }
};

export const emitSocketEvent = (eventName, data) => {
  if (socket) {
    socket.emit(eventName, data);
  }
};

export const subscribeToEvent = (eventName, cb) => {
  if (socket) {
    socket.on(eventName, cb);
  }
};

export const unsubscribeFromEvent = (eventName) => {
  if (socket) {
    socket.off(eventName);
  }
};
