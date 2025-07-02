import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackDocument } from '../types/feedback.types';

// Define the MongoDB schema
const feedbackSchema = new Schema<FeedbackDocument>({
  submitter: {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String },
    userId: { type: String }
  },
  
  recipient: {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String },
    team: { type: String }
  },
  
  feedback: {
    content: { type: String, required: true },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    type: { 
      type: String, 
      required: true,
      enum: ['positive', 'negative', 'suggestion', 'bug', 'feature_request']
    },
    priority: { 
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    category: { type: String }
  },
  
  context: {
    applicationName: { type: String, required: true },
    featureName: { type: String, required: true },
    version: { type: String },
    environment: { 
      type: String,
      enum: ['production', 'staging', 'development'],
      default: 'production'
    },
    userAgent: { type: String },
    url: { type: String }
  },
  
  metadata: {
    attachments: [{ type: String }],
    tags: [{ type: String }],
    customFields: { type: Schema.Types.Mixed },
    sessionId: { type: String },
    timestamp: { type: String }
  },
  
  // System fields
  status: {
    type: String,
    enum: ['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'],
    default: 'new'
  },
  
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  
  // Email tracking
  emailsSent: {
    submitterNotified: { type: Boolean, default: false },
    recipientNotified: { type: Boolean, default: false },
    submitterEmailId: { type: String },
    recipientEmailId: { type: String },
    notificationSentAt: { type: Date }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'feedbacks' // Explicit collection name
});

// Add indexes for better query performance
feedbackSchema.index({ 'submitter.email': 1 });
feedbackSchema.index({ 'recipient.email': 1 });
feedbackSchema.index({ 'context.applicationName': 1 });
feedbackSchema.index({ 'context.featureName': 1 });
feedbackSchema.index({ 'feedback.type': 1 });
feedbackSchema.index({ 'feedback.rating': 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

// Add a compound index for common queries
feedbackSchema.index({ 
  'context.applicationName': 1, 
  'context.featureName': 1, 
  'feedback.type': 1 
});

// Instance methods
feedbackSchema.methods.markAsReviewed = function(reviewerId: string) {
  this.status = 'reviewed';
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  return this.save();
};

feedbackSchema.methods.updateEmailStatus = function(type: 'submitter' | 'recipient', emailId: string) {
  if (type === 'submitter') {
    this.emailsSent.submitterNotified = true;
    this.emailsSent.submitterEmailId = emailId;
  } else {
    this.emailsSent.recipientNotified = true;
    this.emailsSent.recipientEmailId = emailId;
  }
  this.emailsSent.notificationSentAt = new Date();
  return this.save();
};

// Static methods
feedbackSchema.statics.findByApplication = function(applicationName: string) {
  return this.find({ 'context.applicationName': applicationName });
};

feedbackSchema.statics.findByFeature = function(applicationName: string, featureName: string) {
  return this.find({ 
    'context.applicationName': applicationName,
    'context.featureName': featureName 
  });
};

feedbackSchema.statics.findByRating = function(minRating: number, maxRating?: number) {
  const query: any = { 'feedback.rating': { $gte: minRating } };
  if (maxRating) {
    query['feedback.rating'].$lte = maxRating;
  }
  return this.find(query);
};

feedbackSchema.statics.getAnalytics = function(applicationName?: string) {
  const matchStage: any = {};
  if (applicationName) {
    matchStage['context.applicationName'] = applicationName;
  }

  return this.aggregate([
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
};

// Pre-save middleware
feedbackSchema.pre('save', function(next) {
  // Generate tracking ID if not exists
  if (this.isNew && !this.metadata?.customFields?.trackingId) {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.customFields) this.metadata.customFields = {};
    
    this.metadata.customFields.trackingId = `FB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Virtual for tracking ID
feedbackSchema.virtual('trackingId').get(function() {
  return this.metadata?.customFields?.trackingId;
});

// Ensure virtual fields are serialized
feedbackSchema.set('toJSON', { virtuals: true });

// Create and export the model
export const FeedbackModel = mongoose.model<FeedbackDocument>('Feedback', feedbackSchema);

// Database connection utility
export const connectToDatabase = async (connectionString?: string) => {
  try {
    const mongoUri = connectionString || process.env.MONGODB_URI || 'mongodb://localhost:27017/Naradh';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export default FeedbackModel; 