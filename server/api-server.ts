import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { EmailService, EmailPayload } from '../src';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize email service
const emailService = new EmailService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Email Service API'
  });
});

// Get available providers
app.get('/providers', (req, res) => {
  try {
    const providers = emailService.getAvailableProviders();
    res.json({
      success: true,
      providers,
      count: providers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test provider configuration
app.get('/providers/:vendor/test', async (req, res) => {
  try {
    const { vendor } = req.params;
    const isValid = await emailService.testConfiguration(vendor);
    
    res.json({
      success: true,
      vendor,
      isValid,
      message: isValid ? 'Configuration is valid' : 'Configuration is invalid'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send single email
app.post('/email/send', async (req, res) => {
  try {
    const payload: EmailPayload = req.body;
    
    // Validate required fields
    if (!payload.to || !payload.subject || !payload.vendor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, vendor'
      });
    }

    // If no templatePath provided, use default welcome template
    if (!payload.templatePath) {
      payload.templatePath = path.join(__dirname, '../templates/welcome.hbs');
    }

    await emailService.sendEmail(payload);
    
    res.json({
      success: true,
      message: `Email sent successfully using ${payload.vendor} provider`,
      to: payload.to,
      subject: payload.subject,
      vendor: payload.vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send batch emails
app.post('/email/batch', async (req, res) => {
  try {
    const { payloads, options } = req.body;
    
    if (!Array.isArray(payloads) || payloads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'payloads must be a non-empty array'
      });
    }

    // Set default template for payloads without templatePath
    const processedPayloads = payloads.map((payload: EmailPayload) => ({
      ...payload,
      templatePath: payload.templatePath || path.join(__dirname, '../templates/welcome.hbs')
    }));

    const results = await emailService.sendBatchEmails(processedPayloads, options || {});
    
    res.json({
      success: true,
      message: 'Batch email processing completed',
      results: {
        successful: results.successful,
        failed: results.failed,
        total: payloads.length,
        successRate: `${((results.successful / payloads.length) * 100).toFixed(1)}%`
      },
      errors: results.errors.map(err => err.message)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send welcome email (convenience endpoint)
app.post('/email/welcome', async (req, res) => {
  try {
    const { to, firstName, email, companyName, vendor = 'resend' } = req.body;
    
    if (!to || !firstName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, firstName'
      });
    }

    const payload: EmailPayload = {
      to,
      subject: `Welcome to ${companyName || 'Our Platform'}!`,
      templatePath: path.join(__dirname, '../templates/welcome.hbs'),
      vendor,
      variables: {
        firstName,
        email: email || to,
        companyName: companyName || 'Our Platform',
        accountType: 'standard',
        verificationUrl: `https://example.com/verify?email=${encodeURIComponent(to)}`,
        currentDate: new Date().toISOString(),
        features: [
          'Access to core features',
          'Email support',
          'Community access',
          'Regular updates'
        ],
        supportEmail: 'support@example.com'
      }
    };

    await emailService.sendEmail(payload);
    
    res.json({
      success: true,
      message: `Welcome email sent successfully to ${to}`,
      vendor,
      template: 'welcome'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Send password reset email (convenience endpoint)
app.post('/email/password-reset', async (req, res) => {
  try {
    const { to, firstName, resetToken, vendor = 'resend' } = req.body;
    
    if (!to || !resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, resetToken'
      });
    }

    const payload: EmailPayload = {
      to,
      subject: 'Password Reset Request',
      templatePath: path.join(__dirname, '../templates/password-reset.hbs'),
      vendor,
      variables: {
        firstName: firstName || 'User',
        email: to,
        companyName: 'Your Company',
        resetUrl: `https://example.com/reset-password?token=${resetToken}`,
        expirationTime: '24 hours',
        currentDate: new Date().toISOString(),
        supportEmail: 'support@example.com'
      }
    };

    await emailService.sendEmail(payload);
    
    res.json({
      success: true,
      message: `Password reset email sent successfully to ${to}`,
      vendor,
      template: 'password-reset',
      expiresIn: '24 hours'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /providers',
      'GET /providers/:vendor/test',
      'POST /email/send',
      'POST /email/batch',
      'POST /email/welcome',
      'POST /email/password-reset'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Email Service API running on http://localhost:${port}`);
  console.log(`📧 Available providers: ${emailService.getAvailableProviders().join(', ')}`);
  console.log(`🔧 Configure providers using environment variables or email-config.json`);
  console.log(`📖 API Documentation: http://localhost:${port}/health`);
});

export default app; 