/**
 * Naradh - Email & Feedback Service
 * A TypeScript email service using the Factory Design Pattern
 * Supports multiple email providers with a pluggable architecture
 */

import express from 'express';
import cors from 'cors';
import { EmailService } from './EmailService';
import logger from './config/Logger';
import { AVAILABLE_ENDPOINTS, errorResponse, ERRORS, STATUS } from '../server/constants';
import feedbackRoutes from '../server/feedbackRoutes';
import emailRoutes from '../server/emailRoutes';

// Export library components
export { EmailService } from './EmailService';
export {
  EmailPayload,
  EmailProvider,
  EmailProviderConfig,
  TemplateEngine,
  EmailServiceFactory as IEmailServiceFactory,
  ExtendedEmailPayload,
  EmailAttachment,
} from './types/email.types';
export { EmailServiceFactory } from './factory/EmailServiceFactory';
export { EmailConfig } from './config/EmailConfig';
export { TemplateService } from './services/TemplateService';
export { ResendProvider } from './providers/ResendProvider';
export { NodemailerProvider } from './providers/NodemailerProvider';

// Default export for library usage
export default EmailService;

// Only start the server if this file is being run directly
if (require.main === module) {
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

  // Routes
  app.use('/', emailRoutes);
  app.use('/feedback', feedbackRoutes);

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
} 