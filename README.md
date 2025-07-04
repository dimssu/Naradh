# Naradh - Extensible Email & Feedback Service

A comprehensive TypeScript service built using the Factory Design Pattern that supports multiple email providers and includes a complete feedback management system. Send emails using Resend, Nodemailer, collect feedback, and manage it all through a unified API.

## Features

### Email Service
- 🏭 **Factory Pattern**: Pluggable architecture for email providers
- 🔄 **Multiple Providers**: Built-in support for Resend and Nodemailer
- 📝 **Template System**: Handlebars-based email templates with filesystem loading
- ⚡ **Batch Sending**: Send multiple emails with parallel/sequential execution
- 🔧 **Configurable**: Environment variables and config file support
- 🚀 **Extensible**: Easy to add new email providers

### Feedback System
- 💬 **Dual Notifications**: Automatic emails to both submitter and recipient
- 🗄️ **MongoDB Storage**: Persistent feedback storage with analytics
- 🎨 **Beautiful Templates**: Professional HTML email templates
- 📊 **Analytics**: Built-in feedback analytics and reporting
- 🔍 **Filtering**: Advanced feedback filtering and search
- 📋 **Tracking**: Unique tracking IDs for all feedback

### API & Development
- 💪 **TypeScript**: Full type safety and IntelliSense support
- 🌐 **Unified API**: Single server for both email and feedback functionality
- 📖 **Documentation**: Auto-generated API schema documentation
- 🧪 **Testing**: Built-in test endpoints and examples

## Installation

```bash
npm install
```

## Quick Start

### 1. Configure Environment Variables

Copy `env.example` to `.env` and configure your email providers:

```bash
# Resend Configuration
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# SMTP Configuration (for Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

### 2. Start the Unified API Server

```bash
# Start the server (includes both email and feedback APIs)
npm run server
# or
npm run api

# Server will run on http://localhost:3000
```

### 3. Basic Email Usage

```typescript
import { EmailService, EmailPayload } from './src';
import * as path from 'path';

const emailService = new EmailService();

const payload: EmailPayload = {
  to: 'user@example.com',
  subject: 'Welcome to Our Platform!',
  templatePath: path.join(__dirname, 'templates/welcome.hbs'),
  vendor: 'resend', // or 'nodemailer'
  variables: {
    firstName: 'John',
    companyName: 'Acme Corp',
    verificationUrl: 'https://example.com/verify?token=abc123'
  }
};

await emailService.sendEmail(payload);
```

### 4. Feedback System Usage

```bash
# Submit feedback via API
curl -X POST http://localhost:3000/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{
    "submitter": {
      "name": "John Doe",
      "email": "john@customer.com",
      "role": "Customer"
    },
    "recipient": {
      "name": "Jane Smith", 
      "email": "jane@company.com",
      "role": "Product Manager"
    },
    "feedback": {
      "content": "Great feature! Very intuitive.",
      "rating": 5,
      "type": "positive"
    },
    "context": {
      "applicationName": "Web App",
      "featureName": "User Dashboard"
    }
  }'
```

## Architecture

### Factory Pattern Implementation

```
EmailService
    ↓
EmailServiceFactory
    ↓
EmailProvider (Interface)
    ↓
├── ResendProvider
├── NodemailerProvider
└── CustomProvider (extensible)
```

### Core Components

- **EmailService**: Main service class providing high-level API
- **EmailServiceFactory**: Factory for creating provider instances
- **EmailProvider**: Common interface for all providers
- **TemplateService**: Handlebars-based template rendering
- **EmailConfig**: Configuration management (env vars + config files)

## Email Providers

### Built-in Providers

#### Resend Provider
```typescript
// Configuration via environment variables
RESEND_API_KEY=your-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Nodemailer Provider
Supports SMTP, Gmail, Outlook, and other services:

```typescript
// SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

// Or service-based (Gmail, Outlook, etc.)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Adding Custom Providers

Creating a new provider is simple - just implement the `EmailProvider` interface:

```typescript
import { EmailProvider, EmailPayload, EmailProviderConfig } from './src';

class SendGridProvider implements EmailProvider {
  constructor(config: EmailProviderConfig) {
    // Initialize with SendGrid API key, etc.
  }

  async send(payload: EmailPayload): Promise<void> {
    // Implement SendGrid email sending logic
  }
}

// Register the provider
emailService.registerProvider('sendgrid', SendGridProvider, {
  apiKey: 'your-sendgrid-api-key',
  fromEmail: 'noreply@yourdomain.com'
});
```

## Template System

### Handlebars Templates

Create HTML email templates using Handlebars syntax:

```html
<!-- templates/welcome.hbs -->
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {{companyName}}</title>
</head>
<body>
    <h1>Welcome {{uppercase firstName}}!</h1>
    <p>Thank you for joining {{companyName}}.</p>
    
    {{#if accountType}}
    <p>Account Type: {{uppercase accountType}}</p>
    {{/if}}
    
    <a href="{{verificationUrl}}">Verify Email</a>
    
    <ul>
    {{#each features}}
        <li>{{this}}</li>
    {{/each}}
    </ul>
</body>
</html>
```

### Built-in Handlebars Helpers

- `{{uppercase text}}` - Convert to uppercase
- `{{lowercase text}}` - Convert to lowercase
- `{{formatDate date}}` - Format dates
- `{{#ifEquals arg1 arg2}}` - Conditional logic

## Advanced Features

### Batch Email Sending

```typescript
const payloads: EmailPayload[] = [
  { to: 'user1@example.com', subject: 'Welcome', /* ... */ },
  { to: 'user2@example.com', subject: 'Welcome', /* ... */ },
  { to: 'user3@example.com', subject: 'Welcome', /* ... */ }
];

const results = await emailService.sendBatchEmails(payloads, {
  parallel: true,
  continueOnError: true,
  maxConcurrency: 5
});

console.log(`Successful: ${results.successful}, Failed: ${results.failed}`);
```

## API Endpoints

### Email Routes
- `GET /health` - Health check and API status
- `GET /providers` - List available email providers  
- `GET /providers/:vendor/test` - Test provider configuration
- `POST /email/send` - Send single email
- `POST /email/batch` - Send batch emails
- `POST /email/welcome` - Send welcome email (convenience)
- `POST /email/password-reset` - Send password reset email (convenience)

### Feedback Routes
- `POST /feedback/submit` - Submit new feedback with dual notifications
- `GET /feedback/analytics` - Get feedback analytics and statistics
- `GET /feedback/recent` - Get recent feedback with filtering
- `PATCH /feedback/:id/status` - Update feedback status  
- `POST /feedback/test` - Test feedback submission
- `GET /feedback/schema` - Get API documentation

### Quick Testing
```bash
# Test the unified API
./test-unified-api.sh

# Or check API documentation
curl http://localhost:3000/feedback/schema
```

### Configuration Testing

```typescript
// Test provider configurations
const providers = emailService.getAvailableProviders();
for (const provider of providers) {
  const isValid = await emailService.testConfiguration(provider);
  console.log(`${provider}: ${isValid ? 'Valid' : 'Invalid'}`);
}
```

### Dynamic Provider Selection

```typescript
function chooseProvider(emailType: string): string {
  if (emailType === 'transactional') {
    return 'resend'; // Fast delivery
  } else if (emailType === 'marketing') {
    return 'sendgrid'; // Better for marketing
  }
  return 'nodemailer'; // Default
}

const payload = {
  // ... email data
  vendor: chooseProvider('transactional')
};
```

## Configuration Options

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | `re_123...` |
| `RESEND_FROM_EMAIL` | From email address | `noreply@yourdomain.com` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `your-app-password` |

### Config File

Create `email-config.json`:

```json
{
  "resend": {
    "apiKey": "your-resend-api-key",
    "fromEmail": "noreply@yourdomain.com",
    "cacheTemplates": true
  },
  "nodemailer": {
    "fromEmail": "your-email@gmail.com",
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "user": "your-email@gmail.com",
      "password": "your-app-password"
    }
  }
}
```

## Examples

Run the included examples:

```bash
# Basic usage examples
npm run dev examples/basic-usage.ts

# Custom provider examples
npm run dev examples/custom-provider.ts
```

## API Reference

### EmailService

```typescript
class EmailService {
  // Send a single email
  async sendEmail(payload: EmailPayload): Promise<void>
  
  // Send multiple emails
  async sendBatchEmails(payloads: EmailPayload[], options?: BatchOptions): Promise<BatchResults>
  
  // Test provider configuration
  async testConfiguration(vendor: string): Promise<boolean>
  
  // Get available providers
  getAvailableProviders(): string[]
  
  // Register custom provider
  registerProvider(vendor: string, providerClass: ProviderClass, config?: Config): void
}
```

### EmailPayload

```typescript
interface EmailPayload {
  to: string;
  subject: string;
  templatePath: string;
  vendor: 'resend' | 'nodemailer' | string;
  variables?: Record<string, unknown>;
  
  // Optional fields for future extensions
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  [key: string]: any; // Allow vendor-specific options
}
```

## Development

### Build

```bash
npm run build
```

### Run Examples

```bash
npm run dev examples/basic-usage.ts
```

### Project Structure

```
src/
├── types/email.types.ts         # TypeScript interfaces
├── services/TemplateService.ts  # Handlebars template engine
├── providers/                   # Email provider implementations
│   ├── ResendProvider.ts
│   └── NodemailerProvider.ts
├── factory/EmailServiceFactory.ts
├── config/EmailConfig.ts        # Configuration management
├── EmailService.ts              # Main service class
└── index.ts                     # Public API exports

templates/                       # Email templates
├── welcome.hbs
└── password-reset.hbs

examples/                        # Usage examples
├── basic-usage.ts
└── custom-provider.ts
```

## Future Enhancements

- [ ] Email queue system for high-volume sending
- [ ] Retry logic with exponential backoff
- [ ] Email tracking and analytics
- [ ] Template caching optimizations
- [ ] Support for more template engines (EJS, Mustache)
- [ ] Email validation and deliverability checks
- [ ] Webhook support for delivery notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and examples
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Made with ❤️ for extensible email architecture 