import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/config';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

// Import routes
import authRoutes from './routes/auth';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Future routes will be added here:
// app.use('/api/fund-families', fundFamilyRoutes);
// app.use('/api/funds', fundRoutes);
// app.use('/api/investors', investorRoutes);
// app.use('/api/commitments', commitmentRoutes);
// app.use('/api/capital-activities', capitalActivityRoutes);
// app.use('/api/transactions', transactionRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;