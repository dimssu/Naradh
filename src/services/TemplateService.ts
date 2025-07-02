import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { TemplateEngine } from '../types/email.types';

/**
 * Template service that handles loading and rendering email templates
 * Uses Handlebars as the templating engine
 */
export class TemplateService implements TemplateEngine {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private cacheEnabled: boolean;

  constructor(cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;
    this.registerHelpers();
  }

  /**
   * Renders a template with the provided variables
   * @param templatePath - Path to the template file (relative or absolute)
   * @param variables - Variables to inject into the template
   * @returns Rendered HTML string
   */
  async render(templatePath: string, variables?: Record<string, unknown>): Promise<string> {
    try {
      // Get the absolute path
      const absolutePath = path.resolve(templatePath);
      
      // Check cache first
      if (this.cacheEnabled && this.templateCache.has(absolutePath)) {
        const template = this.templateCache.get(absolutePath)!;
        return template(variables || {});
      }

      // Load and compile template
      const templateSource = await this.loadTemplate(absolutePath);
      const template = Handlebars.compile(templateSource);

      // Cache the compiled template
      if (this.cacheEnabled) {
        this.templateCache.set(absolutePath, template);
      }

      // Render and return
      return template(variables || {});
    } catch (error) {
      throw new Error(`Failed to render template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads template content from file system
   * @param templatePath - Absolute path to template file
   * @returns Template content as string
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      return templateContent;
    } catch (error) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
  }

  /**
   * Registers custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper for formatting dates
    Handlebars.registerHelper('formatDate', (date: Date | string, format: string = 'YYYY-MM-DD') => {
      if (!date) return '';
      
      // Handle both Date objects and date strings
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return date.toString(); // Return original if can't parse
      }
      
      // Simple date formatting - in production, consider using a proper date library
      return dateObj.toLocaleDateString();
    });

    // Helper for conditional logic
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    // Helper for uppercase text
    Handlebars.registerHelper('uppercase', (text: string) => {
      return text ? text.toUpperCase() : '';
    });

    // Helper for lowercase text
    Handlebars.registerHelper('lowercase', (text: string) => {
      return text ? text.toLowerCase() : '';
    });

    // Substring helper
    Handlebars.registerHelper('substring', function(str: string, start: number, end?: number) {
      if (!str) return '';
      if (end !== undefined) {
        return str.substring(start, end);
      }
      return str.substring(start);
    });

    // Star rating helper
    Handlebars.registerHelper('stars', function(rating: number) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      
      let stars = '★'.repeat(fullStars);
      if (hasHalfStar) stars += '☆';
      stars += '☆'.repeat(emptyStars);
      
      return stars;
    });

    // Generate star rating based on numeric value
    Handlebars.registerHelper('ratingStars', function(rating: number) {
      const fullStars = Math.floor(rating);
      const emptyStars = 5 - fullStars;
      
      return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
    });

    // JSON stringify helper
    Handlebars.registerHelper('json', function(context: any) {
      return JSON.stringify(context);
    });

    // Default value helper
    Handlebars.registerHelper('default', function(value: any, defaultValue: any) {
      return value || defaultValue;
    });

    // Array length helper
    Handlebars.registerHelper('length', function(array: any[]) {
      return array ? array.length : 0;
    });

    // Math helpers
    Handlebars.registerHelper('add', function(a: number, b: number) {
      return a + b;
    });

    Handlebars.registerHelper('subtract', function(a: number, b: number) {
      return a - b;
    });

    Handlebars.registerHelper('multiply', function(a: number, b: number) {
      return a * b;
    });

    // URL encode helper
    Handlebars.registerHelper('urlEncode', function(str: string) {
      return encodeURIComponent(str || '');
    });

    // Truncate text helper
    Handlebars.registerHelper('truncate', function(str: string, length: number, suffix: string = '...') {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + suffix;
    });

    // Capitalize helper
    Handlebars.registerHelper('capitalize', function(str: string) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Pluralize helper
    Handlebars.registerHelper('pluralize', function(count: number, singular: string, plural?: string) {
      if (count === 1) return singular;
      return plural || (singular + 's');
    });

    // Date from now helper
    Handlebars.registerHelper('fromNow', function(date: Date | string) {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInMinutes < 1) return 'just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      
      return dateObj.toLocaleDateString();
    });
  }

  /**
   * Clears the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Preloads and caches a template
   * @param templatePath - Path to the template file
   */
  async preloadTemplate(templatePath: string): Promise<void> {
    await this.render(templatePath, {});
  }
} 