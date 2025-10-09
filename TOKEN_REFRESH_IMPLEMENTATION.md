# 🔄 Automatic Token Refresh Implementation Guide

## Current Situation
- JWT token expires after **7 days**
- User stays "logged in" but requests fail after token expires
- User has to manually log out and log in again

## Solution Implemented
The backend already has `/auth/refresh` endpoint. We need to add automatic token refresh to the frontend.

## Frontend Implementation

### Step 1: Add Token Expiration Check Utility

Create a helper function to decode JWT and check expiration:

```typescript
// Add to src/utils/tokenHelper.ts (NEW FILE)
export interface DecodedToken {
  exp: number;
  iat: number;
  data: {
    user: {
      id: number;
      email: string;
      roles: string[];
      business_type: string;
    };
  };
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(token: string, hoursBeforeExpiry: number = 24): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;
  const hoursInSeconds = hoursBeforeExpiry * 60 * 60;
  
  return expiresIn < hoursInSeconds;
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}
```

### Step 2: Add Token Refresh Function to authService

```typescript
// Add to src/services/authService.ts

async refreshToken(): Promise<string | null> {
  try {
    const currentToken = localStorage.getItem('eco_swift_token');
    if (!currentToken) return null;

    const response = await authAPI.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });

    if (response.data?.success && response.data?.token) {
      const newToken = response.data.token;
      localStorage.setItem('eco_swift_token', newToken);
      console.log('✅ Token refreshed successfully');
      return newToken;
    }

    return null;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return null;
  }
}
```

### Step 3: Add Auto-Refresh to API Interceptors

Update all API interceptors (orderService.ts, productService.ts, etc.):

```typescript
// Add this to EACH service's request interceptor
import { isTokenExpiringSoon, isTokenExpired } from '@/utils/tokenHelper';
import authService from './authService';

// Before making request, check and refresh token if needed
xxxAPI.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('eco_swift_token');
    
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn('⚠️ Token expired, attempting refresh...');
        const newToken = await authService.refreshToken();
        
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem('eco_swift_token');
          localStorage.removeItem('eco_swift_user');
          window.location.href = '/login';
          return Promise.reject(new Error('Token expired'));
        }
      }
      // Check if token expires within 24 hours
      else if (isTokenExpiringSoon(token, 24)) {
        console.log('🔄 Token expiring soon, refreshing...');
        const newToken = await authService.refreshToken();
        
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          // Refresh failed but token still valid, use existing token
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Step 4: Alternative Simple Solution - Background Auto-Refresh

Add a background refresh that runs every 6 hours:

```typescript
// Add to src/App.tsx or main layout component

import { useEffect } from 'react';
import { isTokenExpiringSoon } from '@/utils/tokenHelper';
import authService from '@/services/authService';

function App() {
  useEffect(() => {
    // Auto-refresh token every 6 hours if expiring soon
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem('eco_swift_token');
      
      if (token && isTokenExpiringSoon(token, 48)) { // Refresh if expires within 2 days
        console.log('🔄 Background token refresh...');
        await authService.refreshToken();
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    return () => clearInterval(refreshInterval);
  }, []);

  // ... rest of app
}
```

## What Happens Now

### Day 1-7
- User logs in, gets token (expires in 7 days)
- Token automatically refreshes every 6 hours in background
- Token expiration keeps getting extended

### Day 8 and Beyond
- Token has been auto-refreshed multiple times
- User never experiences token expiration
- **User stays logged in indefinitely** as long as they use the app regularly

### If User Doesn't Use App for 7+ Days
- Token expires
- Next time they open app and make a request:
  - Frontend detects expired token
  - Attempts to refresh (will fail because token expired)
  - Automatically redirects to login page
  - User logs in with OTP again

## Benefits
✅ User stays logged in as long as they use the app
✅ Seamless experience - no interruptions
✅ Automatic token refresh in background
✅ Secure - token still expires if not used
✅ No code changes needed on backend (endpoint already exists!)

## Testing
1. **Test auto-refresh**: Set token to expire in 1 hour, wait, make API call - should auto-refresh
2. **Test expired token**: Manually expire token, make API call - should redirect to login
3. **Test background refresh**: Leave app open for 6+ hours - token should refresh automatically
