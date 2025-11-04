import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';
import aiRouter from './routes/aiRouter.js';

// ------------------- App Config -------------------
const app = express();

// Use dynamic port for Shiper deployment
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas or local
connectDB();

// Connect Cloudinary
connectCloudinary();

// ------------------- Middlewares -------------------
app.use(express.json());
app.use(cors());

// ------------------- API Routes -------------------
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use('/api', aiRouter);

// ------------------- Test Route -------------------
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// ------------------- HTTP Server -------------------
const server = http.createServer(app);

// ------------------- Socket.io Setup -------------------
const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  },
});

// Map to track online doctors
const onlineDoctors = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('registerDoctor', (doctorId) => {
    onlineDoctors.set(doctorId, socket.id);
    console.log(`Doctor ${doctorId} registered`);
  });

  socket.on('disconnect', () => {
    for (let [key, value] of onlineDoctors.entries()) {
      if (value === socket.id) onlineDoctors.delete(key);
    }
  });
});

// Export for controllers if needed
export { io, onlineDoctors };

// ------------------- Start Server -------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// ------------------- Global Error Handling -------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
