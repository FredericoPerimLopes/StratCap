# Authentication Bypass for Testing

This document explains how to use the authentication bypass feature implemented for testing purposes.

## Overview

The application now includes a comprehensive authentication bypass system that allows testing without valid credentials. This bypass works on both frontend and backend.

## Frontend Changes

- **Login Form**: Modified `/frontend/src/components/Auth/LoginNew.tsx`
- **Validation**: Simplified to require only non-empty email and password fields
- **Visual Indicator**: Added warning banner showing "TESTING MODE: Any email/password will work"
- **Mock Authentication**: Creates mock user with admin privileges automatically

## Backend Changes

- **Middleware**: Modified `/backend/src/middleware/auth.ts` to recognize mock tokens
- **Controller**: Modified `/backend/src/controllers/authController.ts` to accept any credentials in non-production mode
- **Mock Data**: Returns consistent mock user data for testing

## How to Enable Testing Mode

### Option 1: Automatic (Development Mode)
The bypass is automatically enabled when `NODE_ENV` is not `production`.

### Option 2: Environment Variable
Set `TESTING_MODE=true` in your `.env` file:
```env
TESTING_MODE=true
```

## How to Use

### Frontend Login
1. Navigate to the login page
2. Enter any email address (e.g., `test@example.com`)
3. Enter any password (e.g., `password123`)
4. Click "Sign In"
5. You'll be automatically logged in as "Test User" with admin privileges

### API Testing
The backend will accept the mock token `mock-jwt-token-for-testing` and return a mock user profile.

## Mock User Data

When using the bypass, you'll be logged in as:
```javascript
{
  id: 1,
  email: [entered email],
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  isActive: true,
  mfaEnabled: false,
  lastLogin: [current timestamp]
}
```

## Security Notes

⚠️ **IMPORTANT**: This bypass should NEVER be enabled in production environments.

- The bypass only works when `NODE_ENV` is not set to `production`
- Additional safety check via `TESTING_MODE` environment variable
- Visual indicators clearly show when testing mode is active

## Disabling Testing Mode

### For Production
Set `NODE_ENV=production` - this will automatically disable the bypass.

### For Development
Set `TESTING_MODE=false` in your `.env` file or remove the variable entirely if you want to test with real authentication.

## Features That Work with Testing Mode

All application features should work normally with the testing bypass:
- Protected routes and navigation
- API calls with mock authentication
- User profile and preferences
- All admin-level functionality
- Redux state management
- LocalStorage token handling

## Troubleshooting

If you encounter issues:
1. Clear browser cache and localStorage
2. Restart the backend server
3. Check console logs for errors
4. Ensure both frontend and backend changes are applied

## Reverting Changes

To revert to normal authentication:
1. Set `TESTING_MODE=false` in backend `.env`
2. Set `NODE_ENV=production` for production use
3. The application will return to normal authentication flow