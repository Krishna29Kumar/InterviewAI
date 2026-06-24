# Interview AI - Full Stack AI-Powered Prep Platform

**Interview AI** is a premium, SaaS-style dark mode platform designed to help job candidates practice mock interviews, respond using voice or text, track performance metrics, and receive granular grading feedback powered by AI.

---

## Features

- **JWT Authentication**: Secure register, login, session validation, and "Remember Me" credentials caching.
- **Dynamic Interview Setup**: Configure practice sessions by job role, experience level, interview type, difficulty setting, and number of questions.
- **Voice Capabilities**:
  - **Speech-To-Text**: Dictate responses using spoken voice. Integrates the **OpenAI Whisper API** for transcription with automatic client-side **Web Speech API** fallback if Whisper is unconfigured.
  - **Text-To-Speech**: Read question prompts out loud using browser Speech Synthesis.
  - **Replay Response**: Candidates can record and replay their voice responses before submission.
- **Granular AI Evaluations**: Grade responses across Technical Score, Communication, Confidence, Grammar, and Problem Solving with suggestions, strengths, and weaknesses powered by **GPT-4o**.
- **Interactive Analytics**: Interactive line charts, bar comparisons, category breakdowns, and performance insights using **Recharts**.
- **Real-Time Sockets**: Synchronize interview progress and AI loading status using **Socket.io**.
- **Responsive Theme**: default premium dark mode with glassmorphic cards, custom glowing inputs, and Framer Motion entries.

---

## Tech Stack

### Frontend
- **Core**: React 18 (Vite build)
- **Styling**: Tailwind CSS & Vanilla CSS (with glassmorphism styles)
- **Routing**: React Router v6
- **State Management**: Redux Toolkit (auth & active interview slices)
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Toasts**: React Hot Toast

### Backend
- **Core**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **Realtime**: Socket.io
- **Uploads**: Multer
- **AI Core**: OpenAI SDK (GPT-4o & Whisper-1)
- **Hosting Assets**: Cloudinary

---

## Directory Structure

```text
InterviewAI/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/      # Navbar, Footer, ProtectedRoute, etc.
│   │   ├── pages/           # Landing, Login, Dashboard, Session, Profile, Analytics, etc.
│   │   ├── layouts/         # MainLayout, AuthLayout
│   │   ├── hooks/           # useSpeechToText, useTextToSpeech
│   │   ├── routes/          # AppRoutes definition
│   │   ├── services/        # Axios API configurations, Socket listeners
│   │   ├── redux/           # Store configure, slices
│   │   ├── index.css        # Base Tailwind imports & custom glows
│   │   ├── App.jsx          # Toast providers & boot check hooks
│   │   └── main.jsx         # Render hooks
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js       # Proxies API requests to port 5000
│
├── server/
│   ├── config/              # MongoDB, Cloudinary, OpenAI setup
│   ├── controllers/         # Auth, Profile, Interview, Feedback logic
│   ├── middleware/          # Protected JWT filters, Multer buffers, Error handlers
│   ├── models/              # User, Interview, Feedback Mongoose schemas
│   ├── routes/              # Express endpoint mappings
│   ├── services/            # OpenAI completions & transcriptions
│   ├── socket/              # Connection listeners
│   ├── uploads/             # Temp media repository
│   ├── .env.example
│   └── server.js            # Express & socket listener
│
└── README.md
```

---

## Installation & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v16+ recommended).
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection URI.

### 1. Configure the Backend (Server)

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` credentials with your own configurations (such as your `MONGODB_URI`, `OPENAI_API_KEY`, and `CLOUDINARY` credentials).
5. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *(The server will run on `http://localhost:5000`)*

### 2. Configure the Frontend (Client)

1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite developer server:
   ```bash
   npm run dev
   ```
   *(The client will run on `http://localhost:3000`)*

---

## Fallback Design Strategy (Key features)

- **Mock AI Mode**: If `OPENAI_API_KEY` is not provided in your `.env` configuration, the backend automatically switches to a robust local fallback. It generates realistic interview questions depending on the role selection and drafts structured mock evaluations based on answer length so you can test the complete user experience out-of-the-box.
- **Local Avatar Storage**: If Cloudinary credentials are omitted, uploaded profile avatar files are securely written to the local `/uploads/` folder and served statically by the Express application, ensuring zero broken image paths.
- **Local Speech Recognition**: If the Whisper API fails or throws a network exception during voice transcribing, the system falls back to the browser's native Web Speech API (`webkitSpeechRecognition`) to populate the text response area in real-time.
