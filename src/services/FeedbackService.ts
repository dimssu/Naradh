import { EmailService } from '../EmailService';
import { FeedbackModel, connectToDatabase } from '../models/Feedback';
import { 
  FeedbackSubmissionPayload, 
  FeedbackDocument, 
  FeedbackSubmissionResponse,
  FeedbackEmailVariables
} from '../types/feedback.types';

/**
 * Service for handling feedback submissions with dual email notifications
 */
export class FeedbackService {
  private emailService: EmailService;
  private isConnected: boolean = false;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  /**
   * Initialize database connection
   */
  async initialize(mongoUri?: string): Promise<void> {
    try {
      await connectToDatabase(mongoUri);
      this.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to initialize FeedbackService: ${error}`);
    }
  }

  /**
   * Submit feedback with dual email notifications and database storage
   */
  async submitFeedback(payload: FeedbackSubmissionPayload): Promise<FeedbackSubmissionResponse> {
    try {
      // Validate required fields
      this.validatePayload(payload);

      // Ensure database connection
      if (!this.isConnected) {
        await this.initialize();
      }

      // Create feedback document
      const feedbackDoc = await this.saveFeedback(payload);
      const trackingId = feedbackDoc.metadata?.customFields?.trackingId;

      // Send dual email notifications
      const emailResults = await this.sendEmailNotifications(payload, trackingId);

      // Update email status in database
      if (emailResults.submitterEmailSent) {
        feedbackDoc.emailsSent.submitterNotified = true;
        feedbackDoc.emailsSent.submitterEmailId = 'submitted';
        feedbackDoc.emailsSent.notificationSentAt = new Date();
      }
      if (emailResults.recipientEmailSent) {
        feedbackDoc.emailsSent.recipientNotified = true;
        feedbackDoc.emailsSent.recipientEmailId = 'submitted';
        feedbackDoc.emailsSent.notificationSentAt = new Date();
      }
      if (emailResults.submitterEmailSent || emailResults.recipientEmailSent) {
        await feedbackDoc.save();
      }

      return {
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: feedbackDoc._id?.toString(),
        trackingId,
        estimatedResponseTime: this.getEstimatedResponseTime(payload.feedback.type, payload.feedback.priority),
        emailsSent: {
          submitterNotified: emailResults.submitterEmailSent,
          recipientNotified: emailResults.recipientEmailSent
        }
      };

    } catch (error) {
      console.error('Feedback submission error:', error);
      return {
        success: false,
        message: 'Failed to submit feedback',
        emailsSent: {
          submitterNotified: false,
          recipientNotified: false
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save feedback to MongoDB
   */
  private async saveFeedback(payload: FeedbackSubmissionPayload): Promise<FeedbackDocument> {
    const feedbackData: Partial<FeedbackDocument> = {
      submitter: payload.submitter,
      recipient: payload.recipient,
      feedback: payload.feedback,
      context: payload.context,
      metadata: payload.metadata || {},
      status: 'new',
      emailsSent: {
        submitterNotified: false,
        recipientNotified: false
      }
    };

    const feedback = new FeedbackModel(feedbackData);
    return await feedback.save();
  }

  /**
   * Send dual email notifications
   */
  private async sendEmailNotifications(
    payload: FeedbackSubmissionPayload, 
    trackingId: string
  ): Promise<{ submitterEmailSent: boolean; recipientEmailSent: boolean }> {
    
    const submissionDate = new Date().toISOString();
    const ratingStars = '★'.repeat(payload.feedback.rating) + '☆'.repeat(5 - payload.feedback.rating);
    
    // Common variables for both emails
    const commonVariables: Partial<FeedbackEmailVariables> = {
      submitterName: payload.submitter.name,
      recipientName: payload.recipient.name,
      feedbackContent: payload.feedback.content,
      rating: payload.feedback.rating,
      ratingStars,
      feedbackType: payload.feedback.type,
      featureName: payload.context.featureName,
      applicationName: payload.context.applicationName,
      submissionDate: new Date(submissionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      environment: payload.context.environment,
      version: payload.context.version,
      url: payload.context.url,
      companyName: process.env.COMPANY_NAME || 'Dimssu',
      trackingId
    };

    // Send confirmation email to submitter
    const submitterEmailPromise = this.sendSubmitterConfirmation(payload, {
      ...commonVariables,
      confirmationMessage: this.getConfirmationMessage(payload.feedback.type),
      nextSteps: this.getNextSteps(payload.feedback.type),
      supportEmail: process.env.SUPPORT_EMAIL,
    } as FeedbackEmailVariables);

    // Send notification email to recipient
    const recipientEmailPromise = this.sendRecipientNotification(payload, {
      ...commonVariables,
      priority: payload.feedback.priority,
      category: payload.feedback.category,
      submitterEmail: payload.submitter.email,
      submitterRole: payload.submitter.role,
      dashboardUrl: process.env.FEEDBACK_DASHBOARD_URL,
      respondUrl: process.env.FEEDBACK_RESPOND_URL,
    } as FeedbackEmailVariables);

    // Execute both email sends in parallel
    const [submitterResult, recipientResult] = await Promise.allSettled([
      submitterEmailPromise,
      recipientEmailPromise
    ]);

    return {
      submitterEmailSent: submitterResult.status === 'fulfilled',
      recipientEmailSent: recipientResult.status === 'fulfilled'
    };
  }

  /**
   * Send confirmation email to feedback submitter
   */
  private async sendSubmitterConfirmation(
    payload: FeedbackSubmissionPayload, 
    variables: FeedbackEmailVariables
  ): Promise<void> {
    await this.emailService.sendEmail({
      to: payload.submitter.email,
      subject: `Feedback Received - Thank You for Your Input! [${variables.trackingId}]`,
      templatePath: 'templates/feedback-confirmation.hbs',
      variables: variables as Record<string, unknown>,
      vendor: 'resend'
    });
  }

  /**
   * Send notification email to feedback recipient
   */
  private async sendRecipientNotification(
    payload: FeedbackSubmissionPayload, 
    variables: FeedbackEmailVariables
  ): Promise<void> {
    const priorityEmoji = this.getPriorityEmoji(payload.feedback.priority);
    const typeEmoji = this.getTypeEmoji(payload.feedback.type);
    
    await this.emailService.sendEmail({
      to: payload.recipient.email,
      subject: `${priorityEmoji}${typeEmoji} New Feedback: ${payload.context.featureName} (${payload.feedback.rating}/5) [${variables.trackingId}]`,
      templatePath: 'templates/feedback-notification.hbs',
      variables: variables as Record<string, unknown>,
      vendor: 'resend'
    });
  }

  /**
   * Validate payload structure and required fields
   */
  private validatePayload(payload: FeedbackSubmissionPayload): void {
    const errors: string[] = [];

    // Validate submitter
    if (!payload.submitter?.name) errors.push('Submitter name is required');
    if (!payload.submitter?.email) errors.push('Submitter email is required');
    if (!this.isValidEmail(payload.submitter?.email)) errors.push('Submitter email is invalid');

    // Validate recipient
    if (!payload.recipient?.name) errors.push('Recipient name is required');
    if (!payload.recipient?.email) errors.push('Recipient email is required');
    if (!this.isValidEmail(payload.recipient?.email)) errors.push('Recipient email is invalid');

    // Validate feedback
    if (!payload.feedback?.content) errors.push('Feedback content is required');
    if (!payload.feedback?.rating || payload.feedback.rating < 1 || payload.feedback.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
    if (!payload.feedback?.type) errors.push('Feedback type is required');
    if (!['positive', 'negative', 'suggestion', 'bug', 'feature_request'].includes(payload.feedback.type)) {
      errors.push('Invalid feedback type');
    }

    // Validate context
    if (!payload.context?.applicationName) errors.push('Application name is required');
    if (!payload.context?.featureName) errors.push('Feature name is required');

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get confirmation message based on feedback type
   */
  private getConfirmationMessage(feedbackType: string): string {
    const messages = {
      positive: "We're thrilled to hear about your positive experience! Your success stories motivate our team.",
      negative: "We take all feedback seriously and will work to address your concerns promptly.",
      suggestion: "Your suggestions help us build better products. We'll carefully consider your ideas.",
      bug: "Thank you for reporting this issue. Our technical team will investigate and work on a fix.",
      feature_request: "We appreciate your feature ideas! They help shape our product roadmap."
    };
    return messages[feedbackType as keyof typeof messages] || "Thank you for your valuable feedback!";
  }

  /**
   * Get next steps based on feedback type
   */
  private getNextSteps(feedbackType: string): string {
    const steps = {
      positive: "Keep enjoying our product! Share your experience with others if you'd like.",
      negative: "Our team will reach out if we need more details to resolve your concerns.",
      suggestion: "We'll evaluate your suggestion and update you on our decision.",
      bug: "Our developers will investigate and provide updates on the fix progress.",
      feature_request: "We'll assess feasibility and add viable features to our roadmap."
    };
    return steps[feedbackType as keyof typeof steps] || "We'll review your feedback and take appropriate action.";
  }

  /**
   * Get estimated response time based on feedback type and priority
   */
  private getEstimatedResponseTime(feedbackType: string, priority?: string): string {
    if (priority === 'critical') return '2-4 hours';
    if (priority === 'high') return '24-48 hours';
    if (feedbackType === 'bug') return '2-3 business days';
    if (feedbackType === 'negative') return '1-2 business days';
    return '3-5 business days';
  }

  /**
   * Get emoji for priority level
   */
  private getPriorityEmoji(priority?: string): string {
    const emojis = {
      critical: '🚨 ',
      high: '⚡ ',
      medium: '📋 ',
      low: '📝 '
    };
    return emojis[priority as keyof typeof emojis] || '📋 ';
  }

  /**
   * Get emoji for feedback type
   */
  private getTypeEmoji(feedbackType: string): string {
    const emojis = {
      positive: '😊 ',
      negative: '😞 ',
      suggestion: '💡 ',
      bug: '🐛 ',
      feature_request: '🚀 '
    };
    return emojis[feedbackType as keyof typeof emojis] || '📝 ';
  }

  /**
   * Get feedback analytics for an application
   */
  async getAnalytics(applicationName?: string): Promise<any> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const matchStage: any = {};
    if (applicationName) {
      matchStage['context.applicationName'] = applicationName;
    }

    const result = await FeedbackModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$feedback.rating' },
          positiveCount: {
            $sum: { $cond: [{ $eq: ['$feedback.type', 'positive'] }, 1, 0] }
          },
          negativeCount: {
            $sum: { $cond: [{ $eq: ['$feedback.type', 'negative'] }, 1, 0] }
          },
          suggestionCount: {
            $sum: { $cond: [{ $eq: ['$feedback.type', 'suggestion'] }, 1, 0] }
          },
          bugCount: {
            $sum: { $cond: [{ $eq: ['$feedback.type', 'bug'] }, 1, 0] }
          },
          featureRequestCount: {
            $sum: { $cond: [{ $eq: ['$feedback.type', 'feature_request'] }, 1, 0] }
          }
        }
      }
    ]);

    return result[0] || {
      totalFeedbacks: 0,
      averageRating: 0,
      positiveCount: 0,
      negativeCount: 0,
      suggestionCount: 0,
      bugCount: 0,
      featureRequestCount: 0
    };
  }

  /**
   * Get recent feedback with optional filters
   */
  async getRecentFeedback(filters: {
    applicationName?: string;
    featureName?: string;
    feedbackType?: string;
    rating?: { min?: number; max?: number };
    limit?: number;
  } = {}): Promise<FeedbackDocument[]> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const query: any = {};
    
    if (filters.applicationName) {
      query['context.applicationName'] = filters.applicationName;
    }
    if (filters.featureName) {
      query['context.featureName'] = filters.featureName;
    }
    if (filters.feedbackType) {
      query['feedback.type'] = filters.feedbackType;
    }
    if (filters.rating) {
      query['feedback.rating'] = {};
      if (filters.rating.min) query['feedback.rating'].$gte = filters.rating.min;
      if (filters.rating.max) query['feedback.rating'].$lte = filters.rating.max;
    }

    return await FeedbackModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);
  }

  /**
   * Update feedback status
   */
  async updateFeedbackStatus(
    feedbackId: string, 
    status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'dismissed',
    reviewerId?: string
  ): Promise<FeedbackDocument | null> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const feedback = await FeedbackModel.findById(feedbackId);
    if (!feedback) return null;

    feedback.status = status;
    if (status === 'reviewed' && reviewerId) {
      feedback.reviewedAt = new Date();
      feedback.reviewedBy = reviewerId;
    }

    return await feedback.save();
  }
} 