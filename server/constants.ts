export const API_ENDPOINTS = {
    success: true,
    version: '1.0.0',
    endpoints: {
      'POST /feedback/submit': {
        description: 'Submit new feedback with dual email notifications',
        required: ['submitter', 'recipient', 'feedback', 'context'],
        optional: ['metadata']
      },
      'GET /feedback/submit/schema': {
        description: 'Get detailed schema for feedback submission payload'
      },
      'GET /feedback/analytics': {
        description: 'Get feedback analytics',
        query: ['applicationName (optional)']
      },
      'GET /feedback/recent': {
        description: 'Get recent feedback with filters',
        query: ['applicationName', 'featureName', 'feedbackType', 'minRating', 'maxRating', 'limit']
      },
      'PATCH /feedback/:id/status': {
        description: 'Update feedback status',
        required: ['status'],
        optional: ['reviewerId']
      },
      'POST /feedback/test': {
        description: 'Test endpoint with sample data'
      }
    }
  }

  export const AVAILABLE_ENDPOINTS = {
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      '-- Email Routes --',
      'GET /providers',
      'GET /providers/:vendor/test',
      'POST /email/send',
      'POST /email/batch',
      'POST /email/welcome',
      'POST /email/password-reset',
      '-- Feedback Routes --',
      'POST /feedback/submit',
      'GET /feedback/submit/schema',
      'GET /feedback/analytics',
      'GET /feedback/recent',
      'PATCH /feedback/:id/status',
      'POST /feedback/test',
      'GET /feedback/schema'
    ]
  }

  export const FEEDBACK_SUBMIT_SCHEMA = {
    success: true,
    version: '1.0.0',
    endpoint: 'POST /feedback/submit',
    description: 'Submit new feedback with dual email notifications',
    schema: {
      submitter: {
        description: 'Person submitting the feedback',
        required: true,
        type: 'object',
        fields: {
          name: {
            type: 'string',
            required: true,
            description: 'Full name of the person submitting feedback',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            required: true,
            format: 'email',
            description: 'Valid email address of the submitter',
            example: 'john@customer.com'
          },
          role: {
            type: 'string',
            required: false,
            description: 'Role or position of the submitter',
            example: 'Customer'
          },
          userId: {
            type: 'string',
            required: false,
            description: 'Optional user ID for tracking',
            example: 'user_123'
          }
        }
      },
      recipient: {
        description: 'Person or team receiving the feedback notification',
        required: true,
        type: 'object',
        fields: {
          name: {
            type: 'string',
            required: true,
            description: 'Name of the recipient',
            example: 'Jane Smith'
          },
          email: {
            type: 'string',
            required: true,
            format: 'email',
            description: 'Valid email address of the recipient',
            example: 'jane@company.com'
          },
          role: {
            type: 'string',
            required: false,
            description: 'Role of the recipient',
            example: 'Product Manager'
          },
          team: {
            type: 'string',
            required: false,
            description: 'Team or department of the recipient',
            example: 'Frontend Team'
          }
        }
      },
      feedback: {
        description: 'The actual feedback content and metadata',
        required: true,
        type: 'object',
        fields: {
          content: {
            type: 'string',
            required: true,
            description: 'The feedback message content',
            example: 'Great feature! Very intuitive and easy to use.'
          },
          rating: {
            type: 'number',
            required: true,
            minimum: 1,
            maximum: 5,
            description: 'Rating on a scale of 1-5',
            example: 5
          },
          type: {
            type: 'string',
            required: true,
            enum: ['positive', 'negative', 'suggestion', 'bug', 'feature_request'],
            description: 'Type of feedback being submitted',
            example: 'positive'
          },
          priority: {
            type: 'string',
            required: false,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            description: 'Priority level of the feedback',
            example: 'medium'
          },
          category: {
            type: 'string',
            required: false,
            description: 'Category or classification of feedback',
            example: 'UI/UX'
          }
        }
      },
      context: {
        description: 'Context information about where feedback was given',
        required: true,
        type: 'object',
        fields: {
          applicationName: {
            type: 'string',
            required: true,
            description: 'Name of the application',
            example: 'Web Dashboard'
          },
          featureName: {
            type: 'string',
            required: true,
            description: 'Specific feature the feedback is about',
            example: 'User Login'
          },
          version: {
            type: 'string',
            required: false,
            description: 'Application version',
            example: '1.2.0'
          },
          environment: {
            type: 'string',
            required: false,
            enum: ['production', 'staging', 'development'],
            default: 'production',
            description: 'Environment where feedback was given',
            example: 'production'
          },
          userAgent: {
            type: 'string',
            required: false,
            description: 'Browser or device information',
            example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          url: {
            type: 'string',
            required: false,
            format: 'url',
            description: 'URL where feedback was submitted from',
            example: 'https://app.company.com/dashboard'
          }
        }
      },
      metadata: {
        description: 'Optional additional metadata',
        required: false,
        type: 'object',
        fields: {
          attachments: {
            type: 'array',
            items: { type: 'string', format: 'url' },
            required: false,
            description: 'URLs to screenshots, logs, or other attachments',
            example: ['https://example.com/screenshot.png']
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            required: false,
            description: 'Custom tags for categorization',
            example: ['urgent', 'mobile', 'login-issue']
          },
          customFields: {
            type: 'object',
            required: false,
            description: 'Any additional custom data',
            example: { testMode: true, source: 'mobile-app' }
          },
          sessionId: {
            type: 'string',
            required: false,
            description: 'User session identifier',
            example: 'sess_1234567890'
          },
          timestamp: {
            type: 'string',
            required: false,
            format: 'date-time',
            description: 'When feedback was originally created (ISO 8601)',
            example: '2024-01-15T10:30:00Z'
          }
        }
      }
    },
    validation: {
      rules: [
        'submitter.email and recipient.email must be valid email addresses',
        'feedback.rating must be an integer between 1 and 5',
        'feedback.type must be one of: positive, negative, suggestion, bug, feature_request',
        'feedback.priority (if provided) must be one of: low, medium, high, critical',
        'context.environment (if provided) must be one of: production, staging, development',
        'All required fields must be present and non-empty'
      ]
    },
    example: {
      submitter: {
        name: 'John Doe',
        email: 'john@customer.com',
        role: 'Customer',
        userId: 'user_123'
      },
      recipient: {
        name: 'Jane Smith',
        email: 'jane@company.com',
        role: 'Product Manager',
        team: 'Frontend Team'
      },
      feedback: {
        content: 'The new dashboard is fantastic! Very intuitive design.',
        rating: 5,
        type: 'positive',
        priority: 'medium',
        category: 'UI/UX'
      },
      context: {
        applicationName: 'Web Dashboard',
        featureName: 'User Interface',
        version: '2.1.0',
        environment: 'production',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url: 'https://app.company.com/dashboard'
      },
      metadata: {
        tags: ['design', 'positive-feedback'],
        customFields: {
          source: 'user-survey',
          campaign: 'feedback-drive-2024'
        },
        sessionId: 'sess_1642586400'
      }
    }
  }

  export const FEEDBACK_SUBMIT_TEST_DATA = {
    submitter: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Customer',
      userId: 'user_123'
    },
    recipient: {
      name: 'Support Team',
      email: 'support@yourcompany.com',
      role: 'Support',
      team: 'Customer Success'
    },
    feedback: {
      content: 'This is a test feedback submission. The feature works great but could use some improvements in the user interface.',
      rating: 4,
      type: 'suggestion',
      priority: 'medium',
      category: 'User Experience'
    },
    context: {
      applicationName: 'Test Application',
      featureName: 'User Dashboard',
      version: '1.0.0',
      environment: 'development',
      userAgent:'Test Client',
      url: 'https://example.com/dashboard'
    },
    metadata: {
      tags: ['test', 'ui-improvement'],
      customFields: {
        testMode: true,
        source: 'api-test',
        confirmationMessage: 'Thank you for testing our feedback system!'
      },
      sessionId: 'test-session-1706745600000'
    }
  }

  // Reusable response helpers
  export function successResponse(data: any = {}, message: string = 'Success', status: number = 200) {
    return {
      success: true,
      message,
      ...data
    };
  }

  export function errorResponse(error: any, status: number = 500, message: string = 'An error occurred') {
    return {
      success: false,
      message,
      error: error instanceof Error ? error.message : error || 'Unknown error',
      status
    };
  }

  // Common error messages
  export const ERRORS = {
    MISSING_FIELDS: 'Missing required fields',
    INVALID_STATUS: 'Invalid status. Must be one of: new, reviewed, in_progress, resolved, dismissed',
    NOT_FOUND: 'Resource not found',
    INTERNAL: 'Internal server error',
    INVALID_CONFIGURATION: 'Invalid configuration',
    MISSING_PAYLOADS: 'Payloads must be a non-empty array',
  };

  // Common status codes
  export const STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
  };