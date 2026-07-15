/**
 * FILE: server/config/db.js
 * ================================================================
 * YE FILE KYA HAI: MongoDB database ka connection setup.
 *
 * YE KYA KARTI HAI:
 *   Mongoose (MongoDB ke liye ODM library) use karke MongoDB Atlas
 *   (cloud database) se connection banati hai. Connection string
 *   `.env` file ke `MONGODB_URI` variable se aati hai.
 *
 * PROJECT MEIN ROLE: server.js is function ko app start hote hi call
 * karta hai. Agar connection fail ho jaaye, server crash nahi hota —
 * bas error console mein print hota hai, taaki developer dekh ke
 * `.env` fix kar sake, bina poori app down kiye.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGODB_URI .env se aata hai; agar missing ho toh localhost fallback try karta hai
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewai');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server is running with potential DB connection issues. Verify your MONGODB_URI in .env.');
    // Jaan-boojh kar process.exit() nahi kiya — server chalta rahega taaki
    // developer terminal mein error dekh ke turant .env theek kar sake.
  }
};

module.exports = connectDB;
