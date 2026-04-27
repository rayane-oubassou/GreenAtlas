import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import weatherRoutes from './routes/weatherRoutes';
import environmentRoutes from './routes/environmentRoutes';
import waterRoutes from './routes/waterRoutes';
import forestRoutes from './routes/forestRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';

const app = express();

connectDB();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/forest', forestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: '🌿 GreenAtlas API is running',
    timestamp: new Date(),
    version: '1.0.0',
  });
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, () => {
  console.log(`🌿 GreenAtlas Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
