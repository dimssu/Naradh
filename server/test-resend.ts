import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testResendConfiguration() {
  console.log('🔍 Testing Resend Configuration\n');

  // Check environment variables
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  console.log('Environment Variables:');
  console.log(`- RESEND_API_KEY: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET'}`);
  console.log(`- RESEND_FROM_EMAIL: ${fromEmail || 'NOT SET'}\n`);

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    return;
  }

  if (!fromEmail) {
    console.error('❌ RESEND_FROM_EMAIL is not set in environment variables');
    return;
  }

  // Initialize Resend
  const resend = new Resend(apiKey);

  try {
    console.log('📧 Testing Resend API with simple email...\n');

    const response = await resend.emails.send({
      from: fromEmail,
      to: ['test@example.com'], // This won't actually send due to invalid recipient
      subject: 'Test Email from Resend Configuration Test',
      html: '<h1>Test Email</h1><p>This is a test email to validate Resend configuration.</p>'
    });

    console.log('✅ Resend API Response:', response);

    if (response.error) {
      console.error('❌ Resend API Error:', response.error);
      
      // Check for common issues
      if (response.error.message?.includes('domain')) {
        console.log('\n💡 Possible Solution:');
        console.log('   Your "from" email domain may not be verified with Resend.');
        console.log('   Please verify your domain in the Resend dashboard or use a verified domain.');
      }
    } else {
      console.log('✅ Email queued successfully');
    }

  } catch (error) {
    console.error('❌ Error testing Resend:', error);
  }
}

// Run the test
testResendConfiguration().catch(console.error); 