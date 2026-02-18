/**
 * Template example - Create template and send emails
 * 
 * Usage:
 *   NORTHRELAY_API_KEY=nr_live_xxx npm run example:templates
 */

import { NorthRelayClient } from '@northrelay/sdk';

async function main() {
  const client = new NorthRelayClient({
    apiKey: process.env.NORTHRELAY_API_KEY!
  });

  try {
    // 1. Create a template
    console.log('📝 Creating template...');
    const template = await client.templates.create({
      name: 'Welcome Email',
      subject: 'Welcome {{name}}!',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .code { background: #F3F4F6; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to NorthRelay!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>{{name}}</strong>,</p>
            <p>Thanks for signing up! To verify your email, please use the code below:</p>
            <div class="code">{{verificationCode}}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>The NorthRelay Team</p>
          </div>
        </body>
        </html>
      `,
      textContent: 'Hello {{name}}, Your verification code is: {{verificationCode}}. This code will expire in 10 minutes.'
    });

    console.log('✅ Template created:', template.data.id);
    console.log('   Variables:', template.data.extractedVariables);

    // 2. Preview template with sample data
    console.log('\n👁️  Previewing template...');
    const preview = await client.templates.preview(template.data.id, {
      name: 'John Doe',
      verificationCode: '123456'
    });

    console.log('✅ Preview generated');
    console.log('   Subject:', preview.data.subject);
    console.log('   HTML length:', preview.data.html.length, 'characters');

    // 3. Send email using template
    console.log('\n📧 Sending email with template...');
    const result = await client.emails.sendTemplate(
      template.data.id,
      [{ email: 'user@example.com', name: 'John Doe' }],
      {
        name: 'John Doe',
        verificationCode: '123456'
      },
      {
        from: { email: 'noreply@example.com', name: 'Example App' }
      }
    );

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.data.messageId);

    // 4. List all templates
    console.log('\n📋 Listing all templates...');
    const templates = await client.templates.list({ limit: 10 });
    console.log('✅ Found', templates.data.length, 'templates');
    templates.data.forEach(t => {
      console.log('   -', t.name, `(${t.id})`);
    });

    // 5. Clean up (optional - comment out to keep template)
    // console.log('\n🗑️  Deleting template...');
    // await client.templates.delete(template.data.id);
    // console.log('✅ Template deleted');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
