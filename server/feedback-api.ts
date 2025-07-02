import express from 'express';
import cors from 'cors';
import { EmailService } from '../src/EmailService';
import { FeedbackService } from '../src/services/FeedbackService';
import { 
  FeedbackSubmissionPayload, 
  FeedbackSubmissionResponse 
} from '../src/types/feedback.types';

// Initialize Express app
const app = express();
const PORT = process.env.FEEDBACK_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize services
const emailService = new EmailService();
const feedbackService = new FeedbackService(emailService);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'feedback-api'
  });
});

/**
 * POST /api/feedback/submit
 * Submit new feedback with dual email notifications
 */
app.post('/api/feedback/submit', async (req, res) => {
  try {
    const payload: FeedbackSubmissionPayload = req.body;
    
    // Log the feedback submission (without sensitive data)
    console.log('Feedback submission received:', {
      submitter: payload.submitter?.email,
      recipient: payload.recipient?.email,
      application: payload.context?.applicationName,
      feature: payload.context?.featureName,
      type: payload.feedback?.type,
      rating: payload.feedback?.rating
    });

    const result: FeedbackSubmissionResponse = await feedbackService.submitFeedback(payload);
    
    if (result.success) {
      console.log('✅ Feedback submitted successfully:', {
        feedbackId: result.feedbackId,
        trackingId: result.trackingId,
        emailsSent: result.emailsSent
      });
      
      res.status(201).json(result);
    } else {
      console.error('❌ Feedback submission failed:', result.error);
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Feedback API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      emailsSent: {
        submitterNotified: false,
        recipientNotified: false
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/feedback/analytics
 * Get feedback analytics for an application
 */
app.get('/api/feedback/analytics', async (req, res) => {
  try {
    const { applicationName } = req.query;
    const analytics = await feedbackService.getAnalytics(applicationName as string);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/feedback/recent
 * Get recent feedback with optional filters
 */
app.get('/api/feedback/recent', async (req, res) => {
  try {
    const {
      applicationName,
      featureName,
      feedbackType,
      minRating,
      maxRating,
      limit
    } = req.query;

    const filters: any = {};
    
    if (applicationName) filters.applicationName = applicationName as string;
    if (featureName) filters.featureName = featureName as string;
    if (feedbackType) filters.feedbackType = feedbackType as string;
    if (minRating || maxRating) {
      filters.rating = {};
      if (minRating) filters.rating.min = parseInt(minRating as string);
      if (maxRating) filters.rating.max = parseInt(maxRating as string);
    }
    if (limit) filters.limit = parseInt(limit as string);

    const feedback = await feedbackService.getRecentFeedback(filters);
    
    res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Recent feedback API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/feedback/:id/status
 * Update feedback status
 */
app.patch('/api/feedback/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewerId } = req.body;

    if (!['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: new, reviewed, in_progress, resolved, dismissed'
      });
    }

    const updatedFeedback = await feedbackService.updateFeedbackStatus(id, status, reviewerId);
    
    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: updatedFeedback
    });
  } catch (error) {
    console.error('Update status API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/feedback/test
 * Test endpoint with sample data for development
 */
app.post('/api/feedback/test', async (req, res) => {
  try {
    const testPayload: FeedbackSubmissionPayload = {
      submitter: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Customer',
        userId: 'user_123'
      },
      recipient: {
        name: 'Sarah Wilson',
        email: 'sarah@company.com',
        role: 'Product Manager',
        team: 'Frontend Team'
      },
      feedback: {
        content: 'The new dashboard is fantastic! The loading speed has improved significantly and the UI is much more intuitive. Great work!',
        rating: 5,
        type: 'positive',
        priority: 'medium',
        category: 'UI/UX'
      },
      context: {
        applicationName: 'Web Dashboard',
        featureName: 'User Dashboard',
        version: '2.1.0',
        environment: 'production',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        url: 'https://app.company.com/dashboard'
      },
      metadata: {
        tags: ['dashboard', 'performance', 'ui'],
        sessionId: 'sess_' + Date.now(),
        customFields: {
          source: 'in-app-feedback-widget'
        }
      }
    };

    // Allow overriding test data with request body
    const payload = { ...testPayload, ...req.body };
    
    const result = await feedbackService.submitFeedback(payload);
    
    res.status(result.success ? 201 : 400).json({
      ...result,
      testData: true,
      message: result.success 
        ? 'Test feedback submitted successfully!' 
        : 'Test feedback submission failed'
    });
    
  } catch (error) {
    console.error('Test feedback API error:', error);
    res.status(500).json({
      success: false,
      testData: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/feedback/schema
 * Get the feedback submission schema for frontend validation
 */
app.get('/api/feedback/schema', (req, res) => {
  const schema = {
    submitter: {
      name: { type: 'string', required: true },
      email: { type: 'string', required: true, format: 'email' },
      role: { type: 'string', optional: true },
      userId: { type: 'string', optional: true }
    },
    recipient: {
      name: { type: 'string', required: true },
      email: { type: 'string', required: true, format: 'email' },
      role: { type: 'string', optional: true },
      team: { type: 'string', optional: true }
    },
    feedback: {
      content: { type: 'string', required: true, minLength: 10, maxLength: 5000 },
      rating: { type: 'number', required: true, min: 1, max: 5 },
      type: { 
        type: 'string', 
        required: true, 
        enum: ['positive', 'negative', 'suggestion', 'bug', 'feature_request'] 
      },
      priority: { 
        type: 'string', 
        optional: true, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      category: { type: 'string', optional: true }
    },
    context: {
      applicationName: { type: 'string', required: true },
      featureName: { type: 'string', required: true },
      version: { type: 'string', optional: true },
      environment: { 
        type: 'string', 
        optional: true, 
        enum: ['production', 'staging', 'development'],
        default: 'production'
      },
      userAgent: { type: 'string', optional: true },
      url: { type: 'string', optional: true, format: 'url' }
    },
    metadata: {
      attachments: { type: 'array', optional: true },
      tags: { type: 'array', optional: true },
      customFields: { type: 'object', optional: true },
      sessionId: { type: 'string', optional: true },
      timestamp: { type: 'string', optional: true, format: 'date-time' }
    }
  };

  res.json({
    success: true,
    schema,
    examples: {
      bug_report: {
        feedback: { type: 'bug', priority: 'high' },
        context: { environment: 'production' }
      },
      feature_request: {
        feedback: { type: 'feature_request', priority: 'medium' }
      },
      positive_feedback: {
        feedback: { type: 'positive', priority: 'low' }
      }
    }
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/feedback/submit',
      'GET /api/feedback/analytics',
      'GET /api/feedback/recent',
      'PATCH /api/feedback/:id/status',
      'POST /api/feedback/test',
      'GET /api/feedback/schema',
      'GET /health'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Feedback API Server running on port ${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/feedback/submit`);
  console.log(`   GET  http://localhost:${PORT}/api/feedback/analytics`);
  console.log(`   GET  http://localhost:${PORT}/api/feedback/recent`);
  console.log(`   PATCH http://localhost:${PORT}/api/feedback/:id/status`);
  console.log(`   POST http://localhost:${PORT}/api/feedback/test`);
  console.log(`   GET  http://localhost:${PORT}/api/feedback/schema`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`\n💡 Test feedback: curl -X POST http://localhost:${PORT}/api/feedback/test\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app; 