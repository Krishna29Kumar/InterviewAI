/**
 * FILE: server/server.js
 * ================================================================
 * YE FILE KYA HAI: Backend ka MAIN ENTRY POINT — jab bhi `node server.js`
 * ya `npm run dev` chalate hain, sabse pehle yehi file run hoti hai.
 *
 * YE KYA KARTI HAI:
 *   1. Express app banati hai (HTTP server ka framework)
 *   2. MongoDB se connection kholti hai (config/db.js ke through)
 *   3. Socket.io setup karti hai (real-time interview updates ke liye —
 *      jab candidate interview de raha hota hai, tab live status
 *      frontend ko bheja jaata hai)
 *   4. Security middleware lagati hai (helmet, cors)
 *   5. Saari API routes yahin "mount" hoti hain (/api/auth, /api/interview,
 *      /api/dsa, waghera) — matlab yehi file decide karti hai ki kaunsa
 *      URL kaunse routes file ko forward hoga
 *   6. Server ko ek specific PORT (default 5001) pe "listen" karwati hai
 *
 * PROJECT MEIN ROLE: Ye poori Express backend ka "traffic controller" hai.
 * Har request (login, interview submit, DSA questions fetch, waghera)
 * pehle yahin se guzarti hai, phir sahi route/controller ko jaati hai.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// .env file se environment variables load karo (MONGODB_URI, JWT_SECRET, waghera)
dotenv.config();

// ── MongoDB Database Connection ──
// config/db.js mein actual connection logic hai, yahan sirf call karte hain
const connectDB = require('./config/db');
connectDB();

// ── Error handling middleware (404 aur generic error catcher) ──
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// ── Saari feature-wise routes import karo ──
const authRoutes = require('./routes/authRoutes');           // login/register/session
const poseRoutes = require("./routes/poseRoutes");            // camera pose/posture analysis
const profileRoutes = require('./routes/profileRoutes');      // user profile update
const interviewRoutes = require('./routes/interviewRoutes');  // normal AI interview flow
const dsaRoutes = require('./routes/dsaRoutes');               // Company-specific DSA practice

// ── Socket.io ka event handler (real-time interview status updates) ──
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app); // Socket.io ke liye raw HTTP server chahiye, Express app se wrap karte hain

// ── Socket.io Setup ──
// Ye WebSocket connection banata hai taaki interview ke dauran real-time
// events (jaise "answer submitted", "evaluation started") frontend ko
// turant bheje ja sakein, bina baar-baar API poll kiye.
const io = socketIo(server, {
  cors: {
    origin: '*', // Development ke liye sabhi origins allow — production mein specific domain set karna better hoga
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
socketHandler(io); // socket/socketHandler.js mein saare 'on connection' events defined hain

// ── Security & Parsing Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: false, // False rakha hai taaki locally uploaded avatar images bina block hue dikh sakein
}));
app.use(cors());                          // Frontend (alag port pe) se API calls allow karne ke liye
app.use(express.json());                  // Incoming JSON body ko parse karta hai (req.body)
app.use(express.urlencoded({ extended: true }));

// Development mein har request ka log terminal mein print karo (debugging ke liye)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Uploaded files (profile avatars waghera) ko directly URL se serve karo
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes Mounting ──
// Yahan decide hota hai ki /api/xyz URL pe request aane par kaunsi routes
// file usse handle karegi.
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/pose', poseRoutes);
app.use('/api/dsa', dsaRoutes);

// Simple health-check route — browser mein root URL kholne pe ye dikhega
app.get('/', (req, res) => {
  res.json({ message: 'Interview AI API is running...' });
});

// ── Error Handling (hamesha routes ke BAAD lagta hai) ──
app.use(notFound);      // Agar koi bhi route match na ho toh 404 bhejo
app.use(errorHandler);  // Kisi bhi route mein error aaye toh yahan catch hoke clean response jaaye

// ── Server Start ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
