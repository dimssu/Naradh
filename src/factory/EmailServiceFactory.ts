import { EmailProvider, EmailProviderConfig, EmailServiceFactory as IEmailServiceFactory } from '../types/email.types';
import { ResendProvider } from '../providers/ResendProvider';
import { NodemailerProvider } from '../providers/NodemailerProvider';

/**
 * Email Service Factory that implements the Factory Design Pattern
 * Creates and manages email providers based on vendor type
 */
export class EmailServiceFactory implements IEmailServiceFactory {
  private providers: Map<string, new (config: EmailProviderConfig) => EmailProvider> = new Map();
  private configs: Map<string, EmailProviderConfig> = new Map();

  constructor() {
    // Register default providers
    this.registerDefaultProviders();
  }

  /**
   * Registers default email providers
   */
  private registerDefaultProviders(): void {
    this.registerProvider('resend', ResendProvider);
    this.registerProvider('nodemailer', NodemailerProvider);
  }

  /**
   * Registers a new email provider
   * @param vendor - Vendor name (e.g., 'resend', 'nodemailer', 'sendgrid')
   * @param providerClass - Provider class constructor
   */
  registerProvider(vendor: string, providerClass: new (config: EmailProviderConfig) => EmailProvider): void {
    this.providers.set(vendor.toLowerCase(), providerClass);
  }

  /**
   * Sets configuration for a specific vendor
   * @param vendor - Vendor name
   * @param config - Provider configuration
   */
  setProviderConfig(vendor: string, config: EmailProviderConfig): void {
    this.configs.set(vendor.toLowerCase(), config);
  }

  /**
   * Creates an email provider instance based on vendor
   * @param vendor - Email provider vendor name
   * @returns EmailProvider instance
   * @throws Error if vendor is not supported or configuration is missing
   */
  createProvider(vendor: string): EmailProvider {
    const vendorKey = vendor.toLowerCase();
    
    // Check if provider is registered
    if (!this.providers.has(vendorKey)) {
      throw new Error(`Unsupported email provider: ${vendor}. Supported providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    // Get provider configuration
    const config = this.configs.get(vendorKey);
    if (!config) {
      throw new Error(`Configuration not found for provider: ${vendor}. Please set configuration using setProviderConfig()`);
    }

    // Create and return provider instance
    const ProviderClass = this.providers.get(vendorKey)!;
    return new ProviderClass(config);
  }

  /**
   * Gets a list of all registered providers
   * @returns Array of registered provider names
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Checks if a provider is registered
   * @param vendor - Vendor name to check
   * @returns True if provider is registered
   */
  isProviderRegistered(vendor: string): boolean {
    return this.providers.has(vendor.toLowerCase());
  }

  /**
   * Removes a provider from the factory
   * @param vendor - Vendor name to remove
   */
  unregisterProvider(vendor: string): void {
    const vendorKey = vendor.toLowerCase();
    this.providers.delete(vendorKey);
    this.configs.delete(vendorKey);
  }

  /**
   * Creates a provider instance with custom configuration (one-time use)
   * @param vendor - Email provider vendor name
   * @param config - Custom configuration for this instance
   * @returns EmailProvider instance
   */
  createProviderWithConfig(vendor: string, config: EmailProviderConfig): EmailProvider {
    const vendorKey = vendor.toLowerCase();
    
    if (!this.providers.has(vendorKey)) {
      throw new Error(`Unsupported email provider: ${vendor}. Supported providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    const ProviderClass = this.providers.get(vendorKey)!;
    return new ProviderClass(config);
  }
} 