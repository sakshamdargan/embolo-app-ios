// Token helper utilities for JWT management

export interface DecodedToken {
  exp: number;
  iat: number;
  iss: string;
  aud: string;
  data: {
    user: {
      id: number;
      email: string;
      roles: string[];
      business_type: string;
    };
  };
}

/**
 * Decode JWT token to extract payload
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode base64url to base64
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return payload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token will expire within specified hours
 * @param token JWT token
 * @param hoursBeforeExpiry Number of hours before expiry to consider as "expiring soon"
 */
export function isTokenExpiringSoon(token: string, hoursBeforeExpiry: number = 24): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;
  const hoursInSeconds = hoursBeforeExpiry * 60 * 60;
  
  return expiresIn < hoursInSeconds && expiresIn > 0;
}

/**
 * Check if token is already expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

/**
 * Get time until token expiration in seconds
 */
export function getTokenTimeToExpiry(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}

/**
 * Get formatted time remaining until expiration
 */
export function getTokenExpiryFormatted(token: string): string {
  const seconds = getTokenTimeToExpiry(token);
  
  if (seconds === 0) return 'Expired';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
