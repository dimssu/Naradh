import { EmailPayload, EmailProvider } from './types/email.types';
import { EmailServiceFactory } from './factory/EmailServiceFactory';
import { EmailConfig } from './config/EmailConfig';
import logger from './config/Logger';

/**
 * Main Email Service that provides a high-level API for sending emails
 * Uses the Factory Pattern to support multiple email providers
 */
export class EmailService {
  private factory: EmailServiceFactory;
  private config: EmailConfig;

  constructor() {
    this.factory = new EmailServiceFactory();
    this.config = EmailConfig.getInstance();
    this.initializeProviders();
  }

  /**
   * Initializes providers with their configurations
   */
  private initializeProviders(): void {
    const configs = this.config.getAllConfigs();
    
    configs.forEach((providerConfig, vendor) => {
      if (this.factory.isProviderRegistered(vendor)) {
        this.factory.setProviderConfig(vendor, providerConfig);
      }
    });
  }

  /**
   * Sends an email using the specified vendor
   * @param payload - Email payload containing all necessary information
   * @throws Error if vendor is not supported or configuration is missing
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      // Validate payload
      this.validatePayload(payload);

      // Create provider instance
      const provider = this.factory.createProvider(payload.vendor);

      // Send email
      await provider.send(payload);
      
      logger.info(`Email sent successfully using ${payload.vendor} provider`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to send email: ${errorMessage}`);
      throw new Error(`Email sending failed: ${errorMessage}`);
    }
  }

  /**
   * Sends multiple emails (batch sending)
   * @param payloads - Array of email payloads
   * @param options - Batch options (parallel execution, error handling)
   */
  async sendBatchEmails(
    payloads: EmailPayload[], 
    options: { 
      parallel?: boolean; 
      continueOnError?: boolean;
      maxConcurrency?: number;
    } = {}
  ): Promise<{ successful: number; failed: number; errors: Error[] }> {
    const { parallel = true, continueOnError = true, maxConcurrency = 5 } = options;
    const results = { successful: 0, failed: 0, errors: [] as Error[] };

    if (parallel) {
      // Parallel execution with concurrency limit
      const chunks = this.chunkArray(payloads, maxConcurrency);
      
      for (const chunk of chunks) {
        const promises = chunk.map(async (payload) => {
          try {
            await this.sendEmail(payload);
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push(error as Error);
            if (!continueOnError) {
              throw error;
            }
          }
        });

        await Promise.all(promises);
      }
    } else {
      // Sequential execution
      for (const payload of payloads) {
        try {
          await this.sendEmail(payload);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(error as Error);
          if (!continueOnError) {
            throw error;
          }
        }
      }
    }

    return results;
  }

  /**
   * Tests email configuration for a specific vendor
   * @param vendor - Email provider vendor name
   * @returns True if configuration is valid and connection works
   */
  async testConfiguration(vendor: string): Promise<boolean> {
    try {
      const provider = this.factory.createProvider(vendor);
      
      // For Nodemailer, we can test the connection
      if ('verifyConnection' in provider && typeof provider.verifyConnection === 'function') {
        return await (provider as any).verifyConnection();
      }

      // For other providers, just check if we can create the instance
      return true;
    } catch (error) {
      logger.error(`Configuration test failed for ${vendor}:`, error);
      return false;
    }
  }

  /**
   * Gets available email providers
   * @returns Array of registered provider names
   */
  getAvailableProviders(): string[] {
    return this.factory.getRegisteredProviders();
  }

  /**
   * Registers a new email provider
   * @param vendor - Vendor name
   * @param providerClass - Provider class constructor
   * @param config - Provider configuration
   */
  registerProvider(
    vendor: string, 
    providerClass: new (config: any) => EmailProvider,
    config?: any
  ): void {
    this.factory.registerProvider(vendor, providerClass);
    
    if (config) {
      this.factory.setProviderConfig(vendor, config);
    }
  }

  /**
   * Validates email payload
   * @param payload - Email payload to validate
   * @throws Error if payload is invalid
   */
  private validatePayload(payload: EmailPayload): void {
    if (!payload.to || !this.isValidEmail(payload.to)) {
      throw new Error('Invalid or missing recipient email address');
    }

    if (!payload.subject || payload.subject.trim() === '') {
      throw new Error('Email subject is required');
    }

    if (!payload.templatePath || payload.templatePath.trim() === '') {
      throw new Error('Template path is required');
    }

    if (!payload.vendor || payload.vendor.trim() === '') {
      throw new Error('Email vendor is required');
    }

    if (!this.factory.isProviderRegistered(payload.vendor)) {
      throw new Error(`Unsupported email vendor: ${payload.vendor}`);
    }
  }

  /**
   * Validates email address format
   * @param email - Email address to validate
   * @returns True if email format is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Chunks array into smaller arrays
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
} 