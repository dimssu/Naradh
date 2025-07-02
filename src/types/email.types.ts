/**
 * Email payload interface that defines the structure of email data
 */
export interface EmailPayload {
  to: string;
  subject: string;
  templatePath: string;
  variables?: Record<string, unknown>;
  vendor: 'resend' | 'nodemailer' | string; // allow extensibility
  [key: string]: any; // support future extensions
}

/**
 * Common interface that all email providers must implement
 */
export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

/**
 * Configuration interface for email providers
 */
export interface EmailProviderConfig {
  [key: string]: any;
}

/**
 * Template engine interface for processing email templates
 */
export interface TemplateEngine {
  render(templatePath: string, variables?: Record<string, unknown>): Promise<string>;
}

/**
 * Email service factory interface
 */
export interface EmailServiceFactory {
  createProvider(vendor: string): EmailProvider;
  registerProvider(vendor: string, providerClass: new (config: EmailProviderConfig) => EmailProvider): void;
}

/**
 * Extended email payload for future features
 */
export interface ExtendedEmailPayload extends EmailPayload {
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  priority?: 'low' | 'normal' | 'high';
  replyTo?: string;
}

/**
 * Email attachment interface for future use
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  disposition?: 'attachment' | 'inline';
} 