import { EmailService, EmailProvider, EmailPayload, EmailProviderConfig } from '../src';
import { TemplateService } from '../src/services/TemplateService';
import * as path from 'path';

/**
 * Example custom email provider implementation using SendGrid
 * This demonstrates how easy it is to add new providers to the system
 */
class SendGridProvider implements EmailProvider {
  private templateService: TemplateService;
  private apiKey: string;
  private fromEmail: string;

  constructor(config: EmailProviderConfig) {
    if (!config.apiKey) {
      throw new Error('SendGrid API key is required');
    }
    
    if (!config.fromEmail) {
      throw new Error('From email address is required');
    }

    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.templateService = new TemplateService(config.cacheTemplates !== false);
  }

  async send(payload: EmailPayload): Promise<void> {
    try {
      // Render the email template with variables
      const htmlContent = await this.templateService.render(
        payload.templatePath,
        payload.variables
      );

      // Simulate SendGrid API call
      const sendGridData = {
        personalizations: [
          {
            to: [{ email: payload.to }],
            ...(payload.cc && { cc: Array.isArray(payload.cc) 
              ? payload.cc.map(email => ({ email })) 
              : [{ email: payload.cc }] }),
            ...(payload.bcc && { bcc: Array.isArray(payload.bcc) 
              ? payload.bcc.map(email => ({ email })) 
              : [{ email: payload.bcc }] }),
          }
        ],
        from: { email: this.fromEmail },
        subject: payload.subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent
          }
        ],
        // SendGrid-specific features
        ...(payload.categories && { categories: payload.categories }),
        ...(payload.customArgs && { custom_args: payload.customArgs }),
        ...(payload.sendAt && { send_at: payload.sendAt }),
      };

      // In a real implementation, you would use the SendGrid SDK:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send(sendGridData);

      // For this example, we'll just simulate the API call
      console.log('📧 SendGrid Provider: Simulating email send...');
      console.log('📧 SendGrid Data:', JSON.stringify(sendGridData, null, 2));
      
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`✅ Email sent successfully via SendGrid (simulated). To: ${payload.to}`);
    } catch (error) {
      throw new Error(
        `Failed to send email via SendGrid: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Gets provider-specific information
   */
  getProviderInfo(): { name: string; version: string } {
    return {
      name: 'SendGrid',
      version: '1.0.0'
    };
  }
}

/**
 * Example: Creating a provider for AWS SES
 */
class AwsSesProvider implements EmailProvider {
  private templateService: TemplateService;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private fromEmail: string;

  constructor(config: EmailProviderConfig) {
    if (!config.region || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error('AWS credentials and region are required');
    }
    
    if (!config.fromEmail) {
      throw new Error('From email address is required');
    }

    this.region = config.region;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.fromEmail = config.fromEmail;
    this.templateService = new TemplateService(config.cacheTemplates !== false);
  }

  async send(payload: EmailPayload): Promise<void> {
    try {
      // Render the email template with variables
      const htmlContent = await this.templateService.render(
        payload.templatePath,
        payload.variables
      );

      // Simulate AWS SES API call
      const sesParams = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [payload.to],
          ...(payload.cc && { CcAddresses: Array.isArray(payload.cc) ? payload.cc : [payload.cc] }),
          ...(payload.bcc && { BccAddresses: Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc] }),
        },
        Message: {
          Subject: {
            Data: payload.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8'
            }
          }
        },
        // SES-specific options
        ...(payload.replyTo && { ReplyToAddresses: [payload.replyTo] }),
        ...(payload.returnPath && { ReturnPath: payload.returnPath }),
      };

      // In a real implementation, you would use the AWS SDK:
      // const AWS = require('aws-sdk');
      // const ses = new AWS.SES({ region: this.region });
      // await ses.sendEmail(sesParams).promise();

      // For this example, we'll just simulate the API call
      console.log('📧 AWS SES Provider: Simulating email send...');
      console.log('📧 SES Params:', JSON.stringify(sesParams, null, 2));
      
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.log(`✅ Email sent successfully via AWS SES (simulated). To: ${payload.to}`);
    } catch (error) {
      throw new Error(
        `Failed to send email via AWS SES: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  getProviderInfo(): { name: string; version: string } {
    return {
      name: 'AWS SES',
      version: '1.0.0'
    };
  }
}

/**
 * Example usage of custom providers
 */
async function customProviderExample() {
  console.log('🔌 Custom Provider Example\n');

  // Initialize the email service
  const emailService = new EmailService();

  // Register the custom SendGrid provider
  emailService.registerProvider('sendgrid', SendGridProvider, {
    apiKey: 'your-sendgrid-api-key',
    fromEmail: 'noreply@yourdomain.com',
    cacheTemplates: true
  });

  // Register the custom AWS SES provider
  emailService.registerProvider('aws-ses', AwsSesProvider, {
    region: 'us-east-1',
    accessKeyId: 'your-aws-access-key',
    secretAccessKey: 'your-aws-secret-key',
    fromEmail: 'noreply@yourdomain.com',
    cacheTemplates: true
  });

  console.log('Available providers after registration:', emailService.getAvailableProviders());

  // Example payload that works with custom providers
  const emailPayload: EmailPayload = {
    to: 'user@example.com',
    subject: 'Testing Custom Provider',
    templatePath: path.join(__dirname, '../templates/welcome.hbs'),
    vendor: 'sendgrid', // Can be 'sendgrid' or 'aws-ses'
    variables: {
      firstName: 'Jane',
      email: 'user@example.com',
      companyName: 'Tech Startup',
      accountType: 'standard',
      verificationUrl: 'https://example.com/verify?token=custom123',
      currentDate: new Date(),
      features: [
        'Custom email provider integration',
        'Extensible architecture',
        'Multiple vendor support'
      ],
      supportEmail: 'help@techstartup.com'
    },
    // SendGrid-specific options (these will be ignored by other providers)
    categories: ['welcome', 'onboarding'],
    customArgs: {
      campaign_id: 'welcome_series_1',
      user_segment: 'new_users'
    }
  };

  try {
    console.log('\n📤 Sending email with SendGrid provider...');
    await emailService.sendEmail(emailPayload);

    // Switch to AWS SES provider
    emailPayload.vendor = 'aws-ses';
    emailPayload.returnPath = 'bounces@yourdomain.com'; // SES-specific option

    console.log('\n📤 Sending email with AWS SES provider...');
    await emailService.sendEmail(emailPayload);

  } catch (error) {
    console.error('❌ Failed to send emails:', error);
  }
}

/**
 * Example showing dynamic provider switching based on conditions
 */
async function dynamicProviderExample() {
  console.log('\n🔄 Dynamic Provider Switching Example\n');

  const emailService = new EmailService();

  // Register custom providers
  emailService.registerProvider('sendgrid', SendGridProvider, {
    apiKey: 'sendgrid-key',
    fromEmail: 'noreply@example.com'
  });

  emailService.registerProvider('aws-ses', AwsSesProvider, {
    region: 'us-east-1',
    accessKeyId: 'aws-key',
    secretAccessKey: 'aws-secret',
    fromEmail: 'noreply@example.com'
  });

  // Function to choose provider based on email type and volume
  function chooseProvider(emailType: string, isHighVolume: boolean): string {
    if (emailType === 'transactional') {
      return 'resend'; // Fast delivery for transactional emails
    } else if (emailType === 'marketing' && isHighVolume) {
      return 'sendgrid'; // Better for high-volume marketing
    } else {
      return 'aws-ses'; // Cost-effective for regular emails
    }
  }

  const emails = [
    { type: 'transactional', highVolume: false, to: 'user1@example.com' },
    { type: 'marketing', highVolume: true, to: 'user2@example.com' },
    { type: 'notification', highVolume: false, to: 'user3@example.com' }
  ];

  for (const email of emails) {
    const selectedProvider = chooseProvider(email.type, email.highVolume);
    
    const payload: EmailPayload = {
      to: email.to,
      subject: `${email.type} email`,
      templatePath: path.join(__dirname, '../templates/welcome.hbs'),
      vendor: selectedProvider,
      variables: {
        firstName: 'User',
        companyName: 'Dynamic Corp',
        currentDate: new Date()
      }
    };

    try {
      console.log(`📧 Sending ${email.type} email using ${selectedProvider} provider...`);
      await emailService.sendEmail(payload);
    } catch (error) {
      console.error(`❌ Failed to send ${email.type} email:`, error);
    }
  }
}

// Run examples
async function runCustomProviderExamples() {
  await customProviderExample();
  await dynamicProviderExample();
}

// Execute if run directly
if (require.main === module) {
  runCustomProviderExamples().catch(console.error);
}

export { SendGridProvider, AwsSesProvider, customProviderExample, dynamicProviderExample }; 