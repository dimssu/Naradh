import { Resend } from 'resend';
import { EmailProvider, EmailPayload, EmailProviderConfig } from '../types/email.types';
import { TemplateService } from '../services/TemplateService';
import logger from '../config/Logger';

/**
 * Resend email provider implementation
 */
export class ResendProvider implements EmailProvider {
  private resend: Resend;
  private templateService: TemplateService;
  private fromEmail: string;

  constructor(config: EmailProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Resend API key is required');
    }
    
    if (!config.fromEmail) {
      throw new Error('From email address is required');
    }

    this.resend = new Resend(config.apiKey);
    this.templateService = new TemplateService(config.cacheTemplates !== false);
    this.fromEmail = config.fromEmail;
  }

  /**
   * Sends an email using the Resend API
   * @param payload - Email payload containing recipient, subject, template, etc.
   */
  async send(payload: EmailPayload): Promise<void> {
    try {
      // Validate email address
      if (!this.isValidEmail(payload.to)) {
        throw new Error(`Invalid recipient email address: ${payload.to}`);
      }

      // Log the payload for debugging (remove in production)
      logger.info('Sending email with Resend, payload:', {
        to: payload.to,
        subject: payload.subject,
        from: this.fromEmail,
        templatePath: payload.templatePath
      });

      // Render the email template with variables
      const htmlContent = await this.templateService.render(
        payload.templatePath,
        payload.variables
      );

      // Prepare email data for Resend
      const emailData = {
        from: this.fromEmail,
        to: [payload.to],
        subject: payload.subject,
        html: htmlContent,
        // Support additional Resend-specific options from payload
        ...(payload.cc && { cc: Array.isArray(payload.cc) ? payload.cc : [payload.cc] }),
        ...(payload.bcc && { bcc: Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc] }),
        ...(payload.replyTo && { reply_to: payload.replyTo }),
        ...(payload.tags && { tags: payload.tags }),
      };

      logger.info('Sending to Resend API with data:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        htmlLength: emailData.html.length
      });

      // Send the email
      const response = await this.resend.emails.send(emailData);

      logger.info('Resend API Response:', response);

      if (response.error) {
        logger.error('Resend API Error Details:', response.error);
        throw new Error(`Resend API error: ${response.error.message || JSON.stringify(response.error)}`);
      }

      if (!response.data) {
        throw new Error('Resend API returned no data in response');
      }

      logger.info(`Email sent successfully via Resend. ID: ${response.data.id}`);
    } catch (error) {
      logger.error('Error in ResendProvider.send:', error);
      
      // If it's already a Resend API error, re-throw as is
      if (error instanceof Error && error.message.includes('Resend API error')) {
        throw error;
      }
      
      throw new Error(
        `Failed to send email via Resend: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Validates email address format (basic validation)
   * @param email - Email address to validate
   * @returns True if email format is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Gets provider-specific information
   * @returns Provider name and version
   */
  getProviderInfo(): { name: string; version: string } {
    return {
      name: 'Resend',
      version: '1.0.0'
    };
  }
} 