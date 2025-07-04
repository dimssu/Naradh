import express from 'express';
import * as path from 'path';
import { EmailService, EmailPayload } from '../src';
import { successResponse, errorResponse, ERRORS, STATUS } from './constants';

const emailRoutes = express.Router();
const emailService = new EmailService();

// Get available providers
emailRoutes.get('/providers', (req, res) => {
  try {
    const providers = emailService.getAvailableProviders();
    res.json(successResponse({ providers, count: providers.length }, 'Providers retrieved successfully'));
  } catch (error) {
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// Test provider configuration
emailRoutes.get('/providers/:vendor/test', async (req, res) => {
  try {
    const { vendor } = req.params;
    const isValid = await emailService.testConfiguration(vendor);
    res.json(successResponse({ vendor, isValid, message: isValid ? 'Configuration is valid' : 'Configuration is invalid' }, 'Provider configuration tested'));
  } catch (error) {
    res.status(STATUS.BAD_REQUEST).json(errorResponse(error, STATUS.BAD_REQUEST, ERRORS.INVALID_CONFIGURATION));
  }
});

// Send single email
emailRoutes.post('/email/send', async (req, res) => {
  try {
    const payload: EmailPayload = req.body;
    if (!payload.to || !payload.subject || !payload.vendor) {
      return res.status(STATUS.BAD_REQUEST).json(errorResponse('Missing required fields: to, subject, vendor', STATUS.BAD_REQUEST, ERRORS.MISSING_FIELDS));
    }
    if (!payload.templatePath) {
      payload.templatePath = path.join(__dirname, '../templates/welcome.hbs');
    }
    await emailService.sendEmail(payload);
    res.json(successResponse(payload, `Email sent successfully using ${payload.vendor} provider`));
  } catch (error) {
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// Send batch emails
emailRoutes.post('/email/batch', async (req, res) => {
  try {
    const { payloads, options } = req.body;
    if (!Array.isArray(payloads) || payloads.length === 0) {
      return res.status(STATUS.BAD_REQUEST).json(errorResponse('payloads must be a non-empty array', STATUS.BAD_REQUEST, ERRORS.MISSING_PAYLOADS));
    }
    const processedPayloads = payloads.map((payload: EmailPayload) => ({
      ...payload,
      templatePath: payload.templatePath || path.join(__dirname, '../templates/welcome.hbs')
    }));
    const results = await emailService.sendBatchEmails(processedPayloads, options || {});
    res.json(successResponse(results, 'Batch email processing completed'));
  } catch (error) {
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// Send welcome email (convenience endpoint)
emailRoutes.post('/email/welcome', async (req, res) => {
  try {
    const { to, firstName, email, companyName, vendor = 'resend' } = req.body;
    if (!to || !firstName) {
      return res.status(STATUS.BAD_REQUEST).json(errorResponse('Missing required fields: to, firstName', STATUS.BAD_REQUEST, ERRORS.MISSING_FIELDS));
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
    res.json(successResponse(payload, `Welcome email sent successfully to ${to}`));
  } catch (error) {
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

// Send password reset email (convenience endpoint)
emailRoutes.post('/email/password-reset', async (req, res) => {
  try {
    const { to, firstName, resetToken, vendor = 'resend' } = req.body;
    if (!to || !resetToken) {
      return res.status(STATUS.BAD_REQUEST).json(errorResponse('Missing required fields: to, resetToken', STATUS.BAD_REQUEST, ERRORS.MISSING_FIELDS));
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
    res.json(successResponse(payload, `Password reset email sent successfully to ${to}`));
  } catch (error) {
    res.status(STATUS.SERVER_ERROR).json(errorResponse(error, STATUS.SERVER_ERROR, ERRORS.INTERNAL));
  }
});

export default emailRoutes; 