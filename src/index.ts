/**
 * Extensible Email Service
 * A TypeScript email service using the Factory Design Pattern
 * Supports multiple email providers with a pluggable architecture
 */

// Main service
export { EmailService } from './EmailService';

// Types and interfaces
export {
  EmailPayload,
  EmailProvider,
  EmailProviderConfig,
  TemplateEngine,
  EmailServiceFactory as IEmailServiceFactory,
  ExtendedEmailPayload,
  EmailAttachment,
} from './types/email.types';

// Factory
export { EmailServiceFactory } from './factory/EmailServiceFactory';

// Configuration
export { EmailConfig } from './config/EmailConfig';

// Services
export { TemplateService } from './services/TemplateService';

// Providers
export { ResendProvider } from './providers/ResendProvider';
export { NodemailerProvider } from './providers/NodemailerProvider';

// Default export for convenience
import { EmailService as EmailServiceClass } from './EmailService';
export default EmailServiceClass; 