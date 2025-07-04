import express from 'express';
import cors from 'cors';
import { EmailService } from '../src';
import logger from '../src/config/Logger';
import { AVAILABLE_ENDPOINTS, errorResponse, ERRORS, STATUS } from './constants';
import feedbackRoutes from './feedbackRoutes';
import emailRoutes from './emailRoutes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize services
const emailService = new EmailService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Naradh Email & Feedback API'
  });
});

// ========================================
// EMAIL ROUTES
// ========================================

app.use('/', emailRoutes);

// ========================================
// FEEDBACK ROUTES
// ========================================

app.use('/feedback', feedbackRoutes);

// ========================================
// ERROR HANDLING & 404
// ========================================

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(STATUS.SERVER_ERROR).json(errorResponse('Internal server error', STATUS.SERVER_ERROR, ERRORS.INTERNAL));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(STATUS.NOT_FOUND).json(AVAILABLE_ENDPOINTS);
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Naradh API Server running on http://localhost:${port}`);
  logger.info(`📧 Email providers: ${emailService.getAvailableProviders().join(', ')}`);
  logger.info(`💬 Feedback system: Active`);
  logger.info(`🔧 Configure providers using environment variables`);
  logger.info(`📖 API Health: http://localhost:${port}/health`);
  logger.info(`📝 Feedback Schema: http://localhost:${port}/feedback/schema`);
});

export default app; 