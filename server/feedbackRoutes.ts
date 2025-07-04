import express from 'express';
import { EmailService } from '../src';
import { FeedbackService } from '../src/services/FeedbackService';
import { FeedbackSubmissionPayload, FeedbackSubmissionResponse } from '../src/types/feedback.types';
import logger from '../src/config/Logger';
import { FEEDBACK_SUBMIT_SCHEMA, FEEDBACK_SUBMIT_TEST_DATA, successResponse, errorResponse, ERRORS, STATUS } from './constants';

const feedbackRoutes = express.Router();

// Initialize services
const emailService = new EmailService();
const feedbackService = new FeedbackService(emailService);

/**
 * CRUD ROUTES FOR FEEDBACK (for dashboard)
 */

// GET / - List all feedback (paginated)
feedbackRoutes.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const feedbackList = await feedbackService.listFeedback({ skip, limit: parseInt(limit as string) });
    res.json(successResponse(feedbackList, 'Feedback list retrieved successfully'));
  } catch (error) {
    logger.error('List feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// GET /:id - Get feedback by ID
feedbackRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await feedbackService.getFeedbackById(id);
    if (!feedback) {
      return res.status(STATUS.NOT_FOUND).json(errorResponse('Feedback not found', STATUS.NOT_FOUND, ERRORS.NOT_FOUND));
    }
    res.json(successResponse(feedback, 'Feedback retrieved successfully'));
  } catch (error) {
    logger.error('Get feedback by ID API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// POST / - Create new feedback (alias for /submit)
feedbackRoutes.post('/', async (req, res) => {
  try {
    const payload: FeedbackSubmissionPayload = req.body;
    logger.info('Feedback creation received:', payload);
    const result: FeedbackSubmissionResponse = await feedbackService.submitFeedback(payload);
    if (result.success) {
      res.status(STATUS.CREATED).json(result);
    } else {
      res.status(STATUS.BAD_REQUEST).json(result);
    }
  } catch (error) {
    logger.error('Create feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// PUT /:id - Update feedback by ID
feedbackRoutes.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const updatedFeedback = await feedbackService.updateFeedbackById(id, update);
    if (!updatedFeedback) {
      return res.status(STATUS.NOT_FOUND).json(errorResponse('Feedback not found', STATUS.NOT_FOUND, ERRORS.NOT_FOUND));
    }
    res.json(successResponse(updatedFeedback, 'Feedback updated successfully'));
  } catch (error) {
    logger.error('Update feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// DELETE /:id - Delete feedback by ID
feedbackRoutes.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await feedbackService.deleteFeedbackById(id);
    if (!deleted) {
      return res.status(STATUS.NOT_FOUND).json(errorResponse('Feedback not found', STATUS.NOT_FOUND, ERRORS.NOT_FOUND));
    }
    res.json(successResponse({}, 'Feedback deleted successfully'));
  } catch (error) {
    logger.error('Delete feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

/**
 * POST /submit
 * Submit new feedback with dual email notifications
 */
feedbackRoutes.post('/submit', async (req, res) => {
  try {
    const payload: FeedbackSubmissionPayload = req.body;
    logger.info('Feedback submission received:', {
      submitter: payload.submitter?.email,
      recipient: payload.recipient?.email,
      application: payload.context?.applicationName,
      feature: payload.context?.featureName,
      type: payload.feedback?.type,
      rating: payload.feedback?.rating
    });
    const result: FeedbackSubmissionResponse = await feedbackService.submitFeedback(payload);
    if (result.success) {
      logger.info('✅ Feedback submitted successfully:', {
        feedbackId: result.feedbackId,
        trackingId: result.trackingId,
        emailsSent: result.emailsSent
      });
      res.status(STATUS.CREATED).json(result);
    } else {
      logger.error('❌ Feedback submission failed:', result.error);
      res.status(STATUS.BAD_REQUEST).json(result);
    }
  } catch (error) {
    logger.error('Feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse('Internal server error', STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

/**
 * GET /analytics
 * Get feedback analytics for an application
 */
feedbackRoutes.get('/analytics', async (req, res) => {
  try {
    const { applicationName } = req.query;
    const analytics = await feedbackService.getAnalytics(applicationName as string);
    res.json(successResponse(analytics, 'Feedback analytics retrieved successfully'));
  } catch (error) {
    logger.error('Analytics API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

/**
 * GET /recent
 * Get recent feedback with optional filters
 */
feedbackRoutes.get('/recent', async (req, res) => {
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
    res.json(successResponse(feedback, 'Recent feedback retrieved successfully'));
  } catch (error) {
    logger.error('Recent feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

/**
 * PATCH /:id/status
 * Update feedback status
 */
feedbackRoutes.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewerId } = req.body;
    if (!['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
      return res.status(STATUS.BAD_REQUEST).json(errorResponse('Invalid status. Must be one of: new, reviewed, in_progress, resolved, dismissed', STATUS.BAD_REQUEST, ERRORS.INVALID_STATUS));
    }
    const updatedFeedback = await feedbackService.updateFeedbackStatus(id, status, reviewerId);
    if (!updatedFeedback) {
      return res.status(STATUS.NOT_FOUND).json(errorResponse('Feedback not found', STATUS.NOT_FOUND, ERRORS.NOT_FOUND));
    }
    res.json(successResponse(updatedFeedback, 'Feedback status updated successfully'));
  } catch (error) {
    logger.error('Update status API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

/**
 * POST /test
 * Test endpoint with sample data for development
 */
feedbackRoutes.post('/test', async (req, res) => {
  try {
    const testPayload: FeedbackSubmissionPayload = FEEDBACK_SUBMIT_TEST_DATA as FeedbackSubmissionPayload;
    const result: FeedbackSubmissionResponse = await feedbackService.submitFeedback(testPayload);
    res.json(successResponse(result, 'Test feedback submitted successfully'));
  } catch (error) {
    logger.error('Test feedback API error:', error);
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

/**
 * GET /submit/schema
 * Get detailed schema for feedback submission payload
 */
feedbackRoutes.get('/submit/schema', (req, res) => {
  res.json(FEEDBACK_SUBMIT_SCHEMA);
});

/**
 * GET /schema (legacy endpoint)
 * Get API schema documentation for all feedback endpoints
 */
feedbackRoutes.get('/schema', (req, res) => {
  res.json(FEEDBACK_SUBMIT_SCHEMA);
});

export default feedbackRoutes; 