import { Document } from 'mongoose';

/**
 * Feedback submission payload with improved structure
 */
export interface FeedbackSubmissionPayload {
  // Person submitting the feedback
  submitter: {
    name: string;
    email: string;
    role?: string; // e.g., "Customer", "Team Member", "Beta Tester"
    userId?: string; // Optional user ID for tracking
  };

  // Person or team the feedback is about (recipient of feedback notification)
  recipient: {
    name: string;
    email: string;
    role?: string; // e.g., "Product Manager", "Developer", "Support Team"
    team?: string; // e.g., "Frontend Team", "API Team"
  };

  // Feedback content
  feedback: {
    content: string;
    rating: number; // 1-5 scale
    type: 'positive' | 'negative' | 'suggestion' | 'bug' | 'feature_request';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: string; // e.g., "UI/UX", "Performance", "Functionality"
  };

  // Context information
  context: {
    applicationName: string; // e.g., "Mobile App", "Web Dashboard", "API"
    featureName: string; // e.g., "User Login", "Payment Gateway", "File Upload"
    version?: string; // Application version
    environment?: 'production' | 'staging' | 'development';
    userAgent?: string; // Browser/device info
    url?: string; // Page/screen where feedback was given
  };

  // Optional metadata
  metadata?: {
    attachments?: string[]; // URLs to screenshots, logs, etc.
    tags?: string[]; // Custom tags for categorization
    customFields?: Record<string, any>; // Extensible custom data
    sessionId?: string; // User session identifier
    timestamp?: string; // When feedback was originally created
  };
}

/**
 * Feedback document stored in MongoDB
 */
export interface FeedbackDocument extends Document {
  _id: string;
  submitter: FeedbackSubmissionPayload['submitter'];
  recipient: FeedbackSubmissionPayload['recipient'];
  feedback: FeedbackSubmissionPayload['feedback'];
  context: FeedbackSubmissionPayload['context'];
  metadata: FeedbackSubmissionPayload['metadata'];
  
  // System fields
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  
  // Email tracking
  emailsSent: {
    submitterNotified: boolean;
    recipientNotified: boolean;
    submitterEmailId?: string;
    recipientEmailId?: string;
    notificationSentAt?: Date;
  };

  // Instance methods
  markAsReviewed(reviewerId: string): Promise<this>;
  updateEmailStatus(type: 'submitter' | 'recipient', emailId: string): Promise<this>;
}

/**
 * Email template variables for feedback emails
 */
export interface FeedbackEmailVariables {
  // Common variables
  submitterName: string;
  recipientName: string;
  feedbackContent: string;
  rating: number;
  ratingStars: string; // Visual representation
  feedbackType: string;
  featureName: string;
  applicationName: string;
  submissionDate: string;
  
  // Submitter-specific variables
  confirmationMessage?: string;
  nextSteps?: string;
  supportEmail?: string;
  trackingId?: string;
  
  // Recipient-specific variables
  priority?: string;
  category?: string;
  submitterEmail?: string;
  submitterRole?: string;
  dashboardUrl?: string;
  respondUrl?: string;
  
  // Context variables
  environment?: string;
  version?: string;
  url?: string;
  
  // Branding
  companyName: string;
  companyLogo?: string;

  // Index signature to allow additional properties
  [key: string]: any;
}

/**
 * Feedback API response
 */
export interface FeedbackSubmissionResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
  trackingId?: string;
  estimatedResponseTime?: string;
  emailsSent: {
    submitterNotified: boolean;
    recipientNotified: boolean;
  };
  error?: string;
} 