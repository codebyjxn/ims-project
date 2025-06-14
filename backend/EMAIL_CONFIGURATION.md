# Email Configuration for Ticket Purchase Confirmations

This document explains how to configure email functionality to send purchase confirmation emails to users after they buy tickets.

## 🚀 Quick Setup

The system is already configured to send purchase confirmation emails. You just need to configure your email provider settings.

## 📧 Email Provider Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account > Security > App passwords
   - Select "Mail" and generate a password
   - Use this app password (not your regular password)

3. **Configure in docker-compose.dev.yml**:
```yaml
environment:
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
  - SMTP_SECURE=false
  - SMTP_USER=your-email@gmail.com
  - SMTP_PASS=your-app-password
  - SMTP_FROM=your-email@gmail.com
```

### Other Email Providers

#### Outlook/Hotmail
```yaml
- SMTP_HOST=smtp-mail.outlook.com
- SMTP_PORT=587
- SMTP_SECURE=false
```

#### Yahoo
```yaml
- SMTP_HOST=smtp.mail.yahoo.com
- SMTP_PORT=587
- SMTP_SECURE=false
```

#### Custom SMTP Server
```yaml
- SMTP_HOST=your-smtp-server.com
- SMTP_PORT=587
- SMTP_SECURE=false  # or true for SSL
```

## 🎯 What Happens When Users Purchase Tickets

1. **User completes ticket purchase** through the frontend
2. **Purchase is processed** and saved to database
3. **Email is automatically sent** with:
   - Purchase confirmation details
   - Ticket information (IDs, zones, prices)
   - Event details (concert name, date, venue)
   - Payment summary with discounts
   - Important venue information

## 📝 Email Template Features

The email includes:
- **Beautiful HTML design** with responsive layout
- **Plain text version** for better compatibility
- **Ticket details table** with all purchased tickets
- **Payment summary** with discounts applied
- **Event information** (date, venue, time)
- **Important instructions** for venue entry

## 🔧 Testing Email Configuration

You can test your email configuration by:

1. **Start the backend** with your email configuration
2. **Check the logs** for email configuration validation
3. **Purchase a test ticket** to see if emails are sent
4. **Monitor the console** for email sending status

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid login" errors**:
   - Make sure you're using an App Password for Gmail
   - Check username/password are correct
   - Verify 2FA is enabled for Gmail

2. **"Connection timeout" errors**:
   - Check your SMTP_HOST and SMTP_PORT settings
   - Verify your network allows SMTP connections
   - Try different SMTP_SECURE settings (true/false)

3. **"Email not received"**:
   - Check spam/junk folders
   - Verify the recipient email address is correct
   - Check backend logs for sending errors

### Debug Tips:

- Check backend console logs for detailed error messages
- Test with a simple email service first (like Gmail)
- Verify your email provider's SMTP settings
- Make sure no firewall is blocking SMTP ports

## 🔒 Production Considerations

- **Use environment variables** for production credentials
- **Never commit** email credentials to version control
- **Use secure SMTP** (SMTP_SECURE=true) when possible
- **Monitor email sending** for failures and retries
- **Consider email delivery services** like SendGrid, AWS SES for high volume

## 📧 Email Content Customization

The email templates are defined in `backend/src/services/email-service.ts`:

- `generatePurchaseConfirmationHTML()` - HTML email template
- `generatePurchaseConfirmationText()` - Plain text version

You can customize:
- Email styling and branding
- Content and messaging
- Additional information included
- Footer and contact information

## 🔄 How It Works

1. **Ticket purchase completes** in `TicketService.purchaseTickets()`
2. **Email data is prepared** with customer and purchase details
3. **EmailService.sendTicketPurchaseConfirmation()** is called asynchronously
4. **Email is sent** without blocking the purchase response
5. **Errors are logged** but don't affect the purchase success

The email sending is designed to be **non-blocking** - if email fails, the ticket purchase still succeeds. 