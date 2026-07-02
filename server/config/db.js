const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_ai');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server is running with potential DB connection issues. Verify your MONGODB_URI in .env.');
    // Do not crash the process; let it run so the developer can see the error in context
  }
};

module.exports = connectDB;
