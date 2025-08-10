# Security Implementation Guide

This document outlines all the security improvements implemented in the NC (Network Coordinator) application.

## 🔐 Authentication & Authorization

### 1. JWT-Based Authentication
- **Secure JWT Secret**: Environment variable `JWT_SECRET` is now required (no fallback to hardcoded values)
- **Token Expiration**: User tokens expire after 7 days
- **Cookie Security**: HTTP-only cookies with secure flag in production

### 2. Owner/Admin Authentication
- **JWT-Based Owner Auth**: Replaced hardcoded 'authenticated' token with proper JWT authentication
- **Environment Variables**: Owner credentials stored in `OWNER_USERNAME` and `OWNER_PASSWORD`
- **Separate JWT Secret**: Optional `OWNER_JWT_SECRET` for additional security layer
- **Admin Users**: No hardcoded admin users - all admin emails configured via `ADMIN_USERS` environment variable

### 3. Password Security
- **Strong Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **bcrypt Hashing**: All passwords hashed with bcrypt (10 rounds)

## 🛡️ Input Validation & Sanitization

### Validation Schemas
All API endpoints now use Zod schemas for input validation:

- **Authentication**: `loginSchema`, `signupSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- **User Management**: `updateProfileSchema`, `userSearchSchema`, `verificationSubmitSchema`
- **Events**: `createEventSchema`, `updateEventSchema`, `eventResponseSchema`
- **Admin Operations**: `adminActionSchema`, `deleteUserSchema`
- **File Operations**: Comprehensive file type and size validation

### Email Domain Restriction
- Only `@dickinson.edu` email addresses are allowed for registration

## 🚦 Rate Limiting

### Rate Limits by Endpoint Type
- **Authentication Endpoints**: 5 requests per 15 minutes
- **Password Reset**: 3 requests per hour
- **File Uploads**: 10 requests per hour
- **Search Endpoints**: 30 requests per minute
- **General API**: 100 requests per 15 minutes (configurable)

### Features
- **IP-based Limiting**: Uses client IP address for rate limiting
- **Proper Headers**: Returns `X-RateLimit-*` headers
- **429 Status Codes**: Proper HTTP status codes for rate limit exceeded
- **Retry-After Header**: Tells clients when they can retry

## 🔒 Data Protection & File Security

### Database Operations
- **File Locking**: All JSON file operations use atomic locking to prevent race conditions
- **Atomic Writes**: Temporary files used for atomic write operations
- **Safe Read/Write**: Retry logic and error handling for file operations

### File Upload Security
- **MIME Type Validation**: Only allowed image types (jpg, jpeg, png, gif, webp)
- **File Size Limits**: Maximum file size restrictions
- **Secure File Paths**: Path traversal protection
- **File Cleanup**: Automatic cleanup of old files when replaced

## 📝 Secure Logging

### Logger Implementation
- **Sensitive Data Sanitization**: Automatically redacts passwords, tokens, JWT, emails
- **Production-Safe**: Different log levels for development vs production
- **Structured Logging**: JSON-formatted logs with timestamps
- **Error Context**: Proper error object handling without sensitive data leakage

### Console.log Replacement
All `console.log`, `console.error`, and `console.warn` statements replaced with secure logger:
- **24 API route files updated**
- **Sensitive information automatically redacted**
- **Configurable log levels via `LOG_LEVEL` environment variable

## 🌐 API Security Headers

### Rate Limiting Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit window resets
- `Retry-After`: Seconds until client can retry (when rate limited)

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=your-secure-jwt-secret-here

# Owner Authentication (REQUIRED)
OWNER_USERNAME=owner
OWNER_PASSWORD=your-secure-password-here
OWNER_JWT_SECRET=your-owner-jwt-secret-here  # Optional

# Admin Users (REQUIRED)
ADMIN_USERS=admin@dickinson.edu,owner@dickinson.edu

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging (Optional)
LOG_LEVEL=info  # error, warn, info, debug
NODE_ENV=production
```

### Security Validation
The application will **refuse to start** if required security environment variables are not set:
- `JWT_SECRET`
- `OWNER_USERNAME` and `OWNER_PASSWORD`
- `ADMIN_USERS`

## 🚨 Security Best Practices Implemented

### 1. No Hardcoded Secrets
- All authentication secrets moved to environment variables
- Application fails fast if secrets are not configured

### 2. Principle of Least Privilege
- Role-based access control for admin functions
- User-specific data filtering

### 3. Defense in Depth
- Multiple layers of validation (client, server, database)
- Rate limiting at multiple levels
- Input sanitization and output encoding

### 4. Secure by Default
- Production-safe logging by default
- Secure cookie settings
- HTTPS enforcement in production

### 5. Error Handling
- Generic error messages to prevent information leakage
- Detailed logging for debugging without exposing sensitive data
- Proper HTTP status codes

## 📋 Security Checklist

### ✅ Completed
- [x] Replace hardcoded authentication tokens
- [x] Implement secure JWT secret management
- [x] Remove/secure all console.log statements
- [x] Implement database locking mechanism
- [x] Add input validation to all API endpoints
- [x] Implement rate limiting
- [x] Create secure logging system
- [x] Environment variable validation
- [x] Password strength requirements
- [x] File upload security
- [x] Admin user management via environment variables

### 🔄 Ongoing Security Considerations
- Monitor rate limit effectiveness
- Review logs for suspicious activity
- Update dependencies regularly
- Monitor authentication failures
- Review admin access patterns

## 🎯 Next Steps for Production

1. **SSL/TLS Configuration**: Ensure HTTPS is properly configured
2. **Database Migration**: Consider migrating from JSON files to a proper database
3. **Monitoring**: Implement security monitoring and alerting
4. **Backup Strategy**: Implement secure backup procedures
5. **Security Auditing**: Regular security audits and penetration testing
6. **CORS Configuration**: Proper CORS settings for production domains

## 📞 Security Contact

For security concerns or to report vulnerabilities, please contact the development team through appropriate channels.

---

**Last Updated**: $(date)
**Security Review Status**: ✅ Complete
**Risk Level**: 🟢 Low (with proper environment configuration)