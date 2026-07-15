/**
 * FILE: client/src/services/socket.js
 * ================================================================
 * YE FILE KYA HAI: Socket.io CLIENT-SIDE wrapper — real-time
 * interview status updates ke liye backend (socket/socketHandler.js)
 * se connection banata hai.
 *
 * FUNCTIONS:
 *   initiateSocketConnection(interviewId) → Naya socket connection
 *      kholta hai aur turant us interview ki "room" join kar leta hai
 *      (backend mein 'join_interview' event trigger hota hai)
 *   disconnectSocket()      → Connection band karta hai (interview
 *      khatam hone pe ya component unmount hone pe call hota hai)
 *   emitSocketEvent(name, data) → Server ko koi event bhejta hai
 *      (jaise 'submit_answer', 'request_evaluation')
 *   subscribeToEvent(name, cb) → Server se aane wale kisi event ko
 *      sunta hai (abhi InterviewSession.jsx mein directly use nahi
 *      ho raha, future real-time features ke liye ready hai)
 *   unsubscribeFromEvent(name) → Listener hataata hai (cleanup)
 *
 * MODULE-LEVEL `socket` VARIABLE: Jaan-boojh kar ek hi socket instance
 * poore module mein share hoti hai (singleton pattern) — taaki galti
 * se multiple connections na khul jaayen ek hi interview ke liye.
 *
 * PROJECT MEIN ROLE: InterviewSession.jsx interview shuru/submit
 * hone par in functions ko call karke server.js ke socketHandler.js
 * se baat karta hai — taaki "AI evaluating..." jaise live status
 * updates dikha sake.
 */

import { io } from 'socket.io-client';

// Development mein Vite (client) aur Express (server) alag ports pe
// chalte hain, isliye socket ko manually localhost:5001 batana padta
// hai. Production mein dono same origin se serve honge, isliye
// window.location.origin use kar lete hain.
const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : window.location.origin);

let socket = null; // Singleton — poori app mein ek hi socket connection

export const initiateSocketConnection = (interviewId) => {
  if (socket) {
    socket.disconnect(); // Purana connection (agar koi ho) pehle band karo
  }

  socket = io(SOCKET_URL);
  console.log('Connecting socket server...');

  if (interviewId) {
    socket.emit('join_interview', interviewId); // Us interview ki room join karo
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
