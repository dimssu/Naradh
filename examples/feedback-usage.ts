import { EmailService } from '../src/EmailService';
import { FeedbackService } from '../src/services/FeedbackService';
import { FeedbackSubmissionPayload } from '../src/types/feedback.types';

/**
 * Example usage of the Feedback System
 * This demonstrates how to submit different types of feedback with dual email notifications
 */

async function runFeedbackExamples() {
  try {
    // Initialize services
    const emailService = new EmailService();
    const feedbackService = new FeedbackService(emailService);

    console.log('🚀 Starting Feedback System Examples\n');

    // Example 1: Positive Feedback
    console.log('📝 Example 1: Positive Feedback');
    const positiveFeedback: FeedbackSubmissionPayload = {
      submitter: {
        name: 'Alice Johnson',
        email: 'alice@customer.com',
        role: 'Premium Customer',
        userId: 'user_001'
      },
      recipient: {
        name: 'Bob Smith',
        email: 'bob@company.com',
        role: 'Frontend Developer',
        team: 'UI/UX Team'
      },
      feedback: {
        content: 'The new checkout process is incredibly smooth! I was able to complete my purchase in under 30 seconds. The one-click payment option is a game-changer. Excellent work!',
        rating: 5,
        type: 'positive',
        priority: 'low',
        category: 'User Experience'
      },
      context: {
        applicationName: 'E-commerce Platform',
        featureName: 'Checkout Process',
        version: '3.2.1',
        environment: 'production',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url: 'https://shop.company.com/checkout'
      },
      metadata: {
        tags: ['checkout', 'payments', 'ux'],
        sessionId: 'sess_' + Date.now(),
        customFields: {
          source: 'post-purchase-survey',
          purchaseAmount: 125.99,
          paymentMethod: 'one-click'
        }
      }
    };

    const result1 = await feedbackService.submitFeedback(positiveFeedback);
    console.log('✅ Positive feedback result:', {
      success: result1.success,
      trackingId: result1.trackingId,
      emailsSent: result1.emailsSent
    });

    // Example 2: Bug Report
    console.log('\n🐛 Example 2: Bug Report');
    const bugReport: FeedbackSubmissionPayload = {
      submitter: {
        name: 'Charlie Brown',
        email: 'charlie@company.com',
        role: 'QA Tester',
        userId: 'user_002'
      },
      recipient: {
        name: 'Diana Wilson',
        email: 'diana@company.com',
        role: 'Backend Developer',
        team: 'API Team'
      },
      feedback: {
        content: 'The search functionality is returning inconsistent results. When I search for "laptop", sometimes it shows 50 results, other times only 10. The pagination also seems broken - clicking "Next" occasionally shows duplicate items.',
        rating: 2,
        type: 'bug',
        priority: 'high',
        category: 'Search & Discovery'
      },
      context: {
        applicationName: 'E-commerce Platform',
        featureName: 'Product Search',
        version: '3.2.1',
        environment: 'production',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        url: 'https://shop.company.com/search?q=laptop'
      },
      metadata: {
        tags: ['search', 'pagination', 'critical'],
        sessionId: 'sess_' + (Date.now() + 1000),
        customFields: {
          source: 'qa-testing',
          searchQuery: 'laptop',
          expectedResults: 50,
          actualResults: 10,
          reproducible: true
        }
      }
    };

    const result2 = await feedbackService.submitFeedback(bugReport);
    console.log('✅ Bug report result:', {
      success: result2.success,
      trackingId: result2.trackingId,
      estimatedResponseTime: result2.estimatedResponseTime
    });

    // Example 3: Feature Request
    console.log('\n💡 Example 3: Feature Request');
    const featureRequest: FeedbackSubmissionPayload = {
      submitter: {
        name: 'Eve Davis',
        email: 'eve@enterprise.com',
        role: 'Product Manager',
        userId: 'user_003'
      },
      recipient: {
        name: 'Frank Miller',
        email: 'frank@company.com',
        role: 'Product Owner',
        team: 'Product Team'
      },
      feedback: {
        content: 'We would love to see bulk actions for managing orders. Our team processes hundreds of orders daily, and having to update them one by one is time-consuming. Features like bulk status updates, bulk export, and bulk assignment to fulfillment centers would significantly improve our workflow efficiency.',
        rating: 4,
        type: 'feature_request',
        priority: 'medium',
        category: 'Productivity'
      },
      context: {
        applicationName: 'Admin Dashboard',
        featureName: 'Order Management',
        version: '2.8.5',
        environment: 'production',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        url: 'https://admin.company.com/orders'
      },
      metadata: {
        tags: ['bulk-actions', 'productivity', 'enterprise'],
        sessionId: 'sess_' + (Date.now() + 2000),
        customFields: {
          source: 'enterprise-feedback',
          companySize: 'large',
          monthlyOrderVolume: 5000,
          urgency: 'Q1-2024'
        }
      }
    };

    const result3 = await feedbackService.submitFeedback(featureRequest);
    console.log('✅ Feature request result:', {
      success: result3.success,
      trackingId: result3.trackingId,
      estimatedResponseTime: result3.estimatedResponseTime
    });

    // Example 4: Negative Feedback with Suggestions
    console.log('\n😞 Example 4: Negative Feedback with Suggestions');
    const negativeFeedback: FeedbackSubmissionPayload = {
      submitter: {
        name: 'Grace Lee',
        email: 'grace@freelancer.com',
        role: 'Freelancer',
        userId: 'user_004'
      },
      recipient: {
        name: 'Henry Taylor',
        email: 'henry@company.com',
        role: 'UX Designer',
        team: 'Design Team'
      },
      feedback: {
        content: 'The mobile app interface feels cluttered and overwhelming. Too many buttons and options are visible at once, making it hard to focus on the main task. The color scheme is also quite harsh on the eyes during extended use. Consider implementing a cleaner design with better visual hierarchy and perhaps a dark mode option.',
        rating: 2,
        type: 'negative',
        priority: 'medium',
        category: 'Mobile Experience'
      },
      context: {
        applicationName: 'Mobile App',
        featureName: 'Main Dashboard',
        version: '1.4.2',
        environment: 'production',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36',
        url: 'app://dashboard'
      },
      metadata: {
        tags: ['mobile', 'ui', 'accessibility'],
        sessionId: 'sess_' + (Date.now() + 3000),
        customFields: {
          source: 'app-store-review',
          deviceType: 'Android',
          screenSize: '6.1-inch',
          usageFrequency: 'daily'
        }
      }
    };

    const result4 = await feedbackService.submitFeedback(negativeFeedback);
    console.log('✅ Negative feedback result:', {
      success: result4.success,
      trackingId: result4.trackingId,
      estimatedResponseTime: result4.estimatedResponseTime
    });

    // Example 5: Get Analytics
    console.log('\n📊 Example 5: Feedback Analytics');
    const analytics = await feedbackService.getAnalytics('E-commerce Platform');
    console.log('📈 Analytics for E-commerce Platform:', analytics);

    // Example 6: Get Recent Feedback
    console.log('\n📋 Example 6: Recent Feedback');
    const recentFeedback = await feedbackService.getRecentFeedback({
      limit: 5,
      feedbackType: 'positive'
    });
    console.log(`📝 Found ${recentFeedback.length} recent positive feedback items`);

    console.log('\n🎉 All feedback examples completed successfully!');
    console.log('\n📧 Check the email addresses used in the examples for confirmation and notification emails.');

  } catch (error) {
    console.error('❌ Error running feedback examples:', error);
  }
}

// Example of programmatic feedback submission
export async function submitProductFeedback(
  userEmail: string,
  userName: string,
  productManagerEmail: string,
  productManagerName: string,
  feedbackText: string,
  rating: number,
  application: string,
  feature: string
) {
  const emailService = new EmailService();
  const feedbackService = new FeedbackService(emailService);

  const payload: FeedbackSubmissionPayload = {
    submitter: {
      name: userName,
      email: userEmail,
      role: 'Customer'
    },
    recipient: {
      name: productManagerName,
      email: productManagerEmail,
      role: 'Product Manager'
    },
    feedback: {
      content: feedbackText,
      rating,
      type: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'suggestion',
      priority: rating <= 2 ? 'high' : 'medium'
    },
    context: {
      applicationName: application,
      featureName: feature,
      environment: 'production'
    }
  };

  return await feedbackService.submitFeedback(payload);
}

// Example of batch feedback processing
export async function processBatchFeedback(feedbackList: any[]) {
  const emailService = new EmailService();
  const feedbackService = new FeedbackService(emailService);

  const results = [];
  
  for (const item of feedbackList) {
    try {
      const result = await feedbackService.submitFeedback(item);
      results.push({ ...result, originalData: item });
      
      // Add delay between submissions to avoid overwhelming email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: item 
      });
    }
  }

  return results;
}

// Run examples if this file is executed directly
if (require.main === module) {
  runFeedbackExamples().catch(console.error);
}

export { runFeedbackExamples }; 