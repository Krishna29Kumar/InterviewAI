const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room of the active interview
    socket.on('join_interview', (interviewId) => {
      socket.join(interviewId);
      console.log(`Socket ${socket.id} joined interview room: ${interviewId}`);
      socket.to(interviewId).emit('user_joined', { socketId: socket.id });
    });

    // Notify state updates during the session
    socket.on('start_interview', ({ interviewId, role }) => {
      console.log(`Interview ${interviewId} started for role: ${role}`);
      io.to(interviewId).emit('interview_status', { status: 'started', timestamp: new Date() });
    });

    // Emit live status when an answer is processed
    socket.on('submit_answer', ({ interviewId, questionIndex }) => {
      console.log(`Interview ${interviewId} received answer for question index: ${questionIndex}`);
      socket.to(interviewId).emit('answer_received', { questionIndex, timestamp: new Date() });
    });

    // Emit event when candidate requests AI evaluation
    socket.on('request_evaluation', ({ interviewId }) => {
      console.log(`Interview ${interviewId} has requested AI feedback generation`);
      io.to(interviewId).emit('evaluation_status', { status: 'analyzing', message: 'AI is reading answers...' });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
