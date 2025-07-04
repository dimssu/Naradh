import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EmailProviderConfig } from '../types/email.types';
import logger from './Logger';

// Load environment variables
dotenv.config();

/**
 * Configuration service for email providers
 * Loads configuration from environment variables and config files
 */
export class EmailConfig {
  private static instance: EmailConfig;
  private configs: Map<string, EmailProviderConfig> = new Map();

  private constructor() {
    this.loadConfigurations();
  }

  /**
   * Singleton pattern - get instance
   */
  public static getInstance(): EmailConfig {
    if (!EmailConfig.instance) {
      EmailConfig.instance = new EmailConfig();
    }
    return EmailConfig.instance;
  }

  /**
   * Loads configurations from environment variables and config files
   */
  private loadConfigurations(): void {
    // Load from environment variables
    this.loadFromEnvironment();
    
    // Try to load from config file
    this.loadFromConfigFile();
  }

  /**
   * Loads configuration from environment variables
   */
  private loadFromEnvironment(): void {
    // Resend configuration
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      this.configs.set('resend', {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
        cacheTemplates: process.env.RESEND_CACHE_TEMPLATES === 'true',
      });
    }

    // Nodemailer SMTP configuration
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.configs.set('nodemailer', {
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          user: process.env.SMTP_USER,
          password: process.env.SMTP_PASSWORD,
        },
        cacheTemplates: process.env.SMTP_CACHE_TEMPLATES !== 'false',
      });
    }

    // Nodemailer service-based configuration (Gmail, Outlook, etc.)
    if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.configs.set('nodemailer-service', {
        fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        cacheTemplates: process.env.EMAIL_CACHE_TEMPLATES !== 'false',
      });
    }
  }

  /**
   * Loads configuration from config file (email-config.json)
   */
  private loadFromConfigFile(): void {
    const configPaths = [
      path.join(process.cwd(), 'email-config.json'),
      path.join(process.cwd(), 'config', 'email-config.json'),
      path.join(__dirname, '../../email-config.json'),
    ];

    for (const configPath of configPaths) {
      try {
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          
          // Merge configurations (environment variables take precedence)
          Object.keys(configData).forEach(vendor => {
            if (!this.configs.has(vendor)) {
              this.configs.set(vendor, configData[vendor]);
            }
          });
          
          logger.info(`Loaded email configuration from: ${configPath}`);
          break;
        }
      } catch (error) {
        logger.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }

  /**
   * Gets configuration for a specific provider
   * @param vendor - Provider vendor name
   * @returns Provider configuration or undefined
   */
  getProviderConfig(vendor: string): EmailProviderConfig | undefined {
    return this.configs.get(vendor.toLowerCase());
  }

  /**
   * Sets configuration for a provider
   * @param vendor - Provider vendor name
   * @param config - Provider configuration
   */
  setProviderConfig(vendor: string, config: EmailProviderConfig): void {
    this.configs.set(vendor.toLowerCase(), config);
  }

  /**
   * Gets all available provider configurations
   * @returns Map of vendor names to configurations
   */
  getAllConfigs(): Map<string, EmailProviderConfig> {
    return new Map(this.configs);
  }

  /**
   * Checks if configuration exists for a vendor
   * @param vendor - Provider vendor name
   * @returns True if configuration exists
   */
  hasConfig(vendor: string): boolean {
    return this.configs.has(vendor.toLowerCase());
  }

  /**
   * Validates a provider configuration
   * @param vendor - Provider vendor name
   * @param config - Configuration to validate
   * @returns True if configuration is valid
   */
  validateConfig(vendor: string, config: EmailProviderConfig): boolean {
    switch (vendor.toLowerCase()) {
      case 'resend':
        return !!(config.apiKey && config.fromEmail);
      
      case 'nodemailer':
        return !!(config.fromEmail && (
          (config.smtp && config.smtp.host && config.smtp.user && config.smtp.password) ||
          (config.service && config.user && config.password) ||
          config.sendmail
        ));
      
      default:
        // For custom providers, just check that fromEmail exists
        return !!config.fromEmail;
    }
  }

  /**
   * Creates a sample configuration file
   * @param filePath - Path where to create the config file
   */
  createSampleConfig(filePath: string = 'email-config.json'): void {
    const sampleConfig = {
      resend: {
        apiKey: 'your-resend-api-key',
        fromEmail: 'hello@yourdomain.com',
        cacheTemplates: true
      },
      nodemailer: {
        fromEmail: 'your-email@gmail.com',
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          user: 'your-email@gmail.com',
          password: 'your-app-password'
        },
        cacheTemplates: true
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(sampleConfig, null, 2));
    logger.info(`Sample configuration created at: ${filePath}`);
  }
} 