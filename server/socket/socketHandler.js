/**
 * FILE: server/socket/socketHandler.js
 * ================================================================
 * YE FILE KYA HAI: Socket.io ke saare real-time events yahan define
 * hote hain — interview ke dauran live status updates bhejne ke liye.
 *
 * KYU ZAROORI HAI: Normal REST API (jaise /api/interview/submit) sirf
 * "request → response" ek baar chalta hai. Lekin agar hume interview
 * ke dauran real-time updates chahiye (jaise "AI abhi answers padh
 * raha hai...", ya "candidate ne answer submit kar diya"), toh
 * WebSocket (Socket.io) chahiye — ye connection khula rehta hai aur
 * server kabhi bhi client ko event push kar sakta hai, bina client ke
 * baar-baar poll kiye.
 *
 * EVENTS (client → server):
 *   'join_interview'      → Candidate interview room join karta hai
 *                           (room ID = interviewId, taaki har interview
 *                           ka apna alag "channel" ho)
 *   'start_interview'     → Interview shuru hote hi frontend ye bhejta
 *                           hai; server sabko 'interview_status' event
 *                           broadcast karta hai
 *   'submit_answer'       → Har answer submit hone pe fire hota hai;
 *                           room ke baaki listeners ko 'answer_received'
 *                           mil jaata hai
 *   'request_evaluation'  → Final submit ke waqt; server 'evaluation_status'
 *                           event bhejta hai (frontend "AI is reading
 *                           answers..." wala loading message dikhata hai)
 *
 * PROJECT MEIN ROLE: server.js is function ko Socket.io server ke
 * saath initialize karta hai. Frontend ki taraf se services/socket.js
 * (client) in events ko emit/listen karta hai — InterviewSession.jsx
 * mein interview shuru/submit hone par calls hote hain.
 *
 * NOTE: Abhi ye sirf STATUS/NOTIFICATION events hain (UI ko "kya ho
 * raha hai" batane ke liye) — actual data save/evaluate REST API
 * (interviewController.js) se hi hota hai, Socket.io sirf real-time
 * feel dene ke liye hai.
 */

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Candidate apne interview ki "room" join karta hai (interviewId = room name)
    socket.on('join_interview', (interviewId) => {
      socket.join(interviewId);
      console.log(`Socket ${socket.id} joined interview room: ${interviewId}`);
      socket.to(interviewId).emit('user_joined', { socketId: socket.id });
    });

    // Interview start hone ka signal — poore room ko batao
    socket.on('start_interview', ({ interviewId, role }) => {
      console.log(`Interview ${interviewId} started for role: ${role}`);
      io.to(interviewId).emit('interview_status', { status: 'started', timestamp: new Date() });
    });

    // Har baar jab candidate ek answer submit kare, room ko notify karo
    socket.on('submit_answer', ({ interviewId, questionIndex }) => {
      console.log(`Interview ${interviewId} received answer for question index: ${questionIndex}`);
      socket.to(interviewId).emit('answer_received', { questionIndex, timestamp: new Date() });
    });

    // Final submit ke waqt — "AI evaluate kar raha hai" wala status bhejo
    socket.on('request_evaluation', ({ interviewId }) => {
      console.log(`Interview ${interviewId} has requested AI feedback generation`);
      io.to(interviewId).emit('evaluation_status', { status: 'analyzing', message: 'AI is reading answers...' });
    });

    // Client disconnect hone pe bas log karo (cleanup automatic hai Socket.io mein)
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
