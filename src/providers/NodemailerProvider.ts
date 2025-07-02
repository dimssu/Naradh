import * as nodemailer from 'nodemailer';
import { EmailProvider, EmailPayload, EmailProviderConfig } from '../types/email.types';
import { TemplateService } from '../services/TemplateService';

/**
 * Nodemailer email provider implementation
 */
export class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private templateService: TemplateService;
  private fromEmail: string;

  constructor(config: EmailProviderConfig) {
    if (!config.fromEmail) {
      throw new Error('From email address is required');
    }

    // Create transporter based on config
    this.transporter = this.createTransporter(config);
    this.templateService = new TemplateService(config.cacheTemplates !== false);
    this.fromEmail = config.fromEmail;
  }

  /**
   * Creates a Nodemailer transporter based on configuration
   * @param config - Provider configuration
   * @returns Configured Nodemailer transporter
   */
  private createTransporter(config: EmailProviderConfig): nodemailer.Transporter {
    // Support multiple transport configurations
    if (config.smtp) {
      // SMTP configuration
      return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port || 587,
        secure: config.smtp.secure || false,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.password,
        },
        ...config.smtp.options,
      });
    } else if (config.service) {
      // Service-based configuration (Gmail, Outlook, etc.)
      return nodemailer.createTransport({
        service: config.service,
        auth: {
          user: config.user,
          pass: config.password,
        },
        ...config.options,
      });
    } else if (config.sendmail) {
      // Sendmail configuration
      return nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: config.sendmail.path || '/usr/sbin/sendmail',
        ...config.sendmail.options,
      });
    } else {
      throw new Error('Invalid Nodemailer configuration. Please provide smtp, service, or sendmail configuration.');
    }
  }

  /**
   * Sends an email using Nodemailer
   * @param payload - Email payload containing recipient, subject, template, etc.
   */
  async send(payload: EmailPayload): Promise<void> {
    try {
      // Render the email template with variables
      const htmlContent = await this.templateService.render(
        payload.templatePath,
        payload.variables
      );

      // Prepare email data for Nodemailer
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: htmlContent,
        // Support additional Nodemailer-specific options from payload
        ...(payload.cc && { cc: payload.cc }),
        ...(payload.bcc && { bcc: payload.bcc }),
        ...(payload.replyTo && { replyTo: payload.replyTo }),
        ...(payload.attachments && { attachments: payload.attachments }),
        ...(payload.text && { text: payload.text }),
        ...(payload.priority && { priority: payload.priority }),
      };

      // Send the email
      const info = await this.transporter.sendMail(mailOptions);

      console.log(`Email sent successfully via Nodemailer. Message ID: ${info.messageId}`);
      
      // Log additional info if available
      if (info.preview) {
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to send email via Nodemailer: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Verifies the transporter configuration
   * @returns Promise that resolves to true if configuration is valid
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Nodemailer configuration verification failed:', error);
      return false;
    }
  }

  /**
   * Gets provider-specific information
   * @returns Provider name and version
   */
  getProviderInfo(): { name: string; version: string } {
    return {
      name: 'Nodemailer',
      version: '1.0.0'
    };
  }

  /**
   * Closes the transporter connection
   */
  close(): void {
    this.transporter.close();
  }
} 