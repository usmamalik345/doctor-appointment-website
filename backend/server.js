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

// app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api end points
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use('/api', aiRouter);

app.get('/', (req, res) => {
  res.send('Api working...');
});

// ✅ create HTTP server
const server = http.createServer(app);

// ✅ Socket.io setup
const io = new Server(server, {
  cors: { origin: '*' }, // frontend URL yahan daal sakte ho
});

// doctors online track karne ke liye map
const onlineDoctors = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // doctor apna ID register kare
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

// ✅ export for controllers
export { io, onlineDoctors };

// ✅ start server
server.listen(port, () => console.log('Server running on port', port));
