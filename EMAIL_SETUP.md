# Email Configuration Guide

This guide explains how to configure real SMTP email sending for the VideoMeet application.

## Quick Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "VideoMeet App"
3. **Update the `.env` file** in the server directory:

```env
# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_HOST=smtp.live.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo Mail
```env
EMAIL_SERVICE=yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Custom SMTP
```env
EMAIL_SERVICE=
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
```

## Current Features

✅ **Password Reset Emails** - Professional HTML emails with reset links
✅ **OTP Verification** - 6-digit codes for email verification
✅ **Fallback Mode** - Console logging when SMTP not configured
✅ **Security** - Automatic cleanup of expired tokens and OTPs

## OTP System

The application includes a comprehensive OTP (One-Time Password) system:

- **6-digit codes** with configurable expiry (default: 10 minutes)
- **Multiple purposes**: email verification, login verification, password reset
- **Attempt limiting**: Maximum 3 attempts per OTP
- **Automatic cleanup**: Expired and used OTPs are automatically removed

### API Endpoints

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "purpose": "email_verification"  // optional
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "email_verification"  // optional
}
```

## Testing

When SMTP credentials are not configured, all emails will be logged to the console for testing purposes. This includes:

- Password reset links
- OTP verification codes
- Email content and formatting

## Security Notes

- Never commit real credentials to version control
- Use app passwords instead of regular passwords when possible
- Consider using environment-specific `.env` files
- Regularly rotate email credentials
- Monitor email sending quotas and limits

## Troubleshooting

### Common Issues

1. **"Invalid login" error**: Check credentials and enable app passwords
2. **"Connection timeout"**: Verify SMTP host and port settings
3. **"Authentication failed"**: Ensure 2FA is enabled for app passwords
4. **Rate limiting**: Most email providers have sending limits

### Gmail Specific
- Enable "Less secure app access" if not using app passwords (not recommended)
- Check for suspicious activity blocks
- Verify the account isn't locked or flagged

## Production Deployment

For production environments:
1. Use dedicated email service (SendGrid, Mailgun, AWS SES)
2. Set up proper domain authentication (SPF, DKIM, DMARC)
3. Monitor email delivery rates and reputation
4. Implement proper error handling and retry logic
5. Use environment variables for all sensitive configuration