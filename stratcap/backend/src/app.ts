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
import fundFamilyRoutes from './routes/fundFamily';
import capitalActivityRoutes from './routes/capitalActivity';
import fundRoutes from './routes/fund';
import investorRoutes from './routes/investor';
import commitmentRoutes from './routes/commitment';
import transactionRoutes from './routes/transaction';
import reportRoutes from './routes/report';
import feeRoutes from './routes/fees';
import waterfallRoutes from './routes/waterfall';
import analyticsRoutes from './routes/analytics';
import creditFacilityRoutes from './routes/creditFacilityRoutes';
import dataAnalysisRoutes from './routes/dataAnalysisRoutes';
import generalLedgerRoutes from './routes/generalLedgerRoutes';

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
app.use('/api/fund-families', fundFamilyRoutes);
app.use('/api', capitalActivityRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/commitments', commitmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/waterfall', waterfallRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/credit-facilities', creditFacilityRoutes);
app.use('/api/data-analysis', dataAnalysisRoutes);
app.use('/api/general-ledger', generalLedgerRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;