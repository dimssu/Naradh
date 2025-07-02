import { EmailService, EmailPayload } from '../src';
import * as path from 'path';

/**
 * Basic usage example for the Email Service
 */
async function basicUsageExample() {
  console.log('🚀 Email Service - Basic Usage Example\n');

  // Initialize the email service
  const emailService = new EmailService();

  // Check available providers
  console.log('Available providers:', emailService.getAvailableProviders());

  // Example 1: Send a welcome email using Resend
  const welcomePayload: EmailPayload = {
    to: 'user@example.com',
    subject: 'Welcome to Our Platform!',
    templatePath: path.join(__dirname, '../templates/welcome.hbs'),
    vendor: 'resend',
    variables: {
      firstName: 'John',
      email: 'user@example.com',
      companyName: 'Acme Corporation',
      accountType: 'premium',
      verificationUrl: 'https://example.com/verify?token=abc123',
      currentDate: new Date(),
      features: [
        'Access to premium features',
        'Priority customer support',
        'Advanced analytics dashboard',
        'Custom integrations'
      ],
      supportEmail: 'support@example.com',
      unsubscribeUrl: 'https://example.com/unsubscribe',
      privacyUrl: 'https://example.com/privacy'
    }
  };

  try {
    console.log('Sending welcome email...');
    await emailService.sendEmail(welcomePayload);
    console.log('✅ Welcome email sent successfully!\n');
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }

  // Example 2: Send a password reset email using Nodemailer
  const passwordResetPayload: EmailPayload = {
    to: 'user@example.com',
    subject: 'Password Reset Request',
    templatePath: path.join(__dirname, '../templates/password-reset.hbs'),
    vendor: 'nodemailer',
    variables: {
      firstName: 'John',
      email: 'user@example.com',
      companyName: 'Acme Corporation',
      resetUrl: 'https://example.com/reset-password?token=xyz789',
      expirationTime: '24 hours',
      currentDate: new Date(),
      supportEmail: 'support@example.com'
    }
  };

  try {
    console.log('Sending password reset email...');
    await emailService.sendEmail(passwordResetPayload);
    console.log('✅ Password reset email sent successfully!\n');
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
  }

  // Example 3: Test provider configurations
  console.log('Testing provider configurations...');
  
  for (const provider of emailService.getAvailableProviders()) {
    const isConfigValid = await emailService.testConfiguration(provider);
    console.log(`${provider}: ${isConfigValid ? '✅ Valid' : '❌ Invalid'}`);
  }
}

// Example 4: Batch email sending
async function batchEmailExample() {
  console.log('\n📧 Batch Email Sending Example\n');

  const emailService = new EmailService();
  
  const batchPayloads: EmailPayload[] = [
    {
      to: 'user1@example.com',
      subject: 'Welcome User 1',
      templatePath: path.join(__dirname, '../templates/welcome.hbs'),
      vendor: 'resend',
      variables: {
        firstName: 'Alice',
        email: 'user1@example.com',
        companyName: 'Acme Corp',
        verificationUrl: 'https://example.com/verify?token=user1',
        currentDate: new Date(),
        features: ['Feature 1', 'Feature 2']
      }
    },
    {
      to: 'user2@example.com',
      subject: 'Welcome User 2',
      templatePath: path.join(__dirname, '../templates/welcome.hbs'),
      vendor: 'resend',
      variables: {
        firstName: 'Bob',
        email: 'user2@example.com',
        companyName: 'Acme Corp',
        verificationUrl: 'https://example.com/verify?token=user2',
        currentDate: new Date(),
        features: ['Feature 1', 'Feature 2']
      }
    },
    {
      to: 'user3@example.com',
      subject: 'Welcome User 3',
      templatePath: path.join(__dirname, '../templates/welcome.hbs'),
      vendor: 'resend',
      variables: {
        firstName: 'Charlie',
        email: 'user3@example.com',
        companyName: 'Acme Corp',
        verificationUrl: 'https://example.com/verify?token=user3',
        currentDate: new Date(),
        features: ['Feature 1', 'Feature 2']
      }
    }
  ];

  try {
    console.log('Sending batch emails...');
    const results = await emailService.sendBatchEmails(batchPayloads, {
      parallel: true,
      continueOnError: true,
      maxConcurrency: 3
    });

    console.log(`\n📊 Batch Results:`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
  } catch (error) {
    console.error('❌ Batch email sending failed:', error);
  }
}

// Run examples
async function runExamples() {
  await basicUsageExample();
  await batchEmailExample();
}

// Execute if run directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { basicUsageExample, batchEmailExample }; 