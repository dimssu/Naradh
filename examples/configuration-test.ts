import { EmailService, EmailPayload } from '../src';
import * as path from 'path';

/**
 * Configuration test example showing how to set up providers
 * This example uses mock configurations for demonstration
 */
async function configurationTestExample() {
  console.log('🔧 Configuration Test Example\n');

  const emailService = new EmailService();

  // Example: Manually configure providers (for testing/demo purposes)
  console.log('Setting up mock configurations...');

  // Get the factory and set mock configurations
  const factory = (emailService as any).factory;
  
  // Mock Resend configuration
  factory.setProviderConfig('resend', {
    apiKey: 'mock-resend-api-key',
    fromEmail: 'test@example.com',
    cacheTemplates: true
  });

  // Mock Nodemailer configuration  
  factory.setProviderConfig('nodemailer', {
    fromEmail: 'test@example.com',
    smtp: {
      host: 'mock-smtp.example.com',
      port: 587,
      secure: false,
      user: 'test@example.com',
      password: 'mock-password'
    },
    cacheTemplates: true
  });

  console.log('Available providers:', emailService.getAvailableProviders());

  // Test configuration validation
  console.log('\nTesting configurations...');
  for (const provider of emailService.getAvailableProviders()) {
    try {
      // This will succeed because we have configurations now
      // (though actual sending would fail with mock data)
      const provider_instance = factory.createProvider(provider);
      console.log(`${provider}: ✅ Configuration Valid`);
    } catch (error) {
      console.log(`${provider}: ❌ Configuration Invalid - ${error}`);
    }
  }

  // Example payload (won't actually send due to mock config)
  const testPayload: EmailPayload = {
    to: 'user@example.com',
    subject: 'Configuration Test',
    templatePath: path.join(__dirname, '../templates/welcome.hbs'),
    vendor: 'resend',
    variables: {
      firstName: 'Test User',
      companyName: 'Test Company',
      email: 'user@example.com',
      verificationUrl: 'https://example.com/verify',
      currentDate: new Date(),
      features: ['Test Feature 1', 'Test Feature 2']
    }
  };

  console.log('\n📧 Testing email payload validation...');
  try {
    // This will validate the payload but fail at actual sending
    await emailService.sendEmail(testPayload);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Resend API error')) {
      console.log('✅ Payload validation passed (failed at API call as expected with mock data)');
    } else {
      console.log('❌ Unexpected error:', error);
    }
  }

  console.log('\n🎉 Configuration system is working correctly!');
  console.log('📝 To use with real providers:');
  console.log('   1. Set up environment variables (see env.example)');
  console.log('   2. Or create email-config.json with real credentials');
  console.log('   3. The system will automatically load and use them');
}

// Example: Dynamic provider configuration
async function dynamicConfigExample() {
  console.log('\n🔄 Dynamic Configuration Example\n');

  const emailService = new EmailService();

  // Simulate different environments
  const environments = {
    development: {
      provider: 'nodemailer',
      config: {
        fromEmail: 'dev@example.com',
        smtp: {
          host: 'localhost',
          port: 1025, // MailHog or similar
          secure: false,
          user: '',
          password: ''
        }
      }
    },
    staging: {
      provider: 'resend',
      config: {
        apiKey: 'test-key',
        fromEmail: 'staging@example.com'
      }
    },
    production: {
      provider: 'resend',
      config: {
        apiKey: 'prod-key',
        fromEmail: 'noreply@yourcompany.com'
      }
    }
  };

  const currentEnv = 'development'; // Would come from process.env.NODE_ENV

  console.log(`🌍 Current environment: ${currentEnv}`);
  
  const envConfig = environments[currentEnv as keyof typeof environments];
  console.log(`📧 Using provider: ${envConfig.provider}`);

  // Set configuration for current environment
  const factory = (emailService as any).factory;
  factory.setProviderConfig(envConfig.provider, envConfig.config);

  console.log('✅ Environment-specific configuration loaded');

  // Show that different environments can use different providers
  console.log('\n📊 Environment Provider Matrix:');
  Object.entries(environments).forEach(([env, config]) => {
    console.log(`   ${env}: ${config.provider}`);
  });
}

// Run examples
async function runConfigExamples() {
  await configurationTestExample();
  await dynamicConfigExample();
}

// Execute if run directly
if (require.main === module) {
  runConfigExamples().catch(console.error);
}

export { configurationTestExample, dynamicConfigExample }; 