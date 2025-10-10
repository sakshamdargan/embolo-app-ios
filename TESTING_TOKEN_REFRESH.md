# 🧪 Testing Guide: Auto Token Refresh System

## ✅ Implementation Complete!

The auto token refresh system has been implemented in your app. Here's how to test it:

---

## 📍 **Where the Code Is**

### **Main Implementation:**
- **File**: `src/App.tsx`
- **Lines**: 27-73 (useEffect hook)

### **Helper Functions:**
- **File**: `src/utils/tokenHelper.ts`
- **All token utilities**

---

## 🧪 **How to Test**

### **Method 1: Quick Test (30 seconds interval)**

1. **Open** `src/App.tsx`
2. **Find line 69** (the setInterval line):
   ```typescript
   const refreshInterval = setInterval(refreshToken, 6 * 60 * 60 * 1000);
   ```

3. **Change to 30 seconds** for testing:
   ```typescript
   const refreshInterval = setInterval(refreshToken, 30000); // 30 seconds
   ```

4. **Save and reload the app**

5. **Open browser console** (F12)

6. **Watch the logs every 30 seconds:**
   - First time: `✅ Token still fresh, time remaining: 6d 23h`
   - After token expires soon: `🔄 Token expiring soon, auto-refreshing...`
   - Success: `✅ Token auto-refreshed successfully! New expiry: 7d 0h`

---

### **Method 2: Test with "Expiring Soon" Threshold**

1. **Open** `src/App.tsx`
2. **Find line 33** (the expiring soon check):
   ```typescript
   if (isTokenExpiringSoon(token, 48)) {
   ```

3. **Change 48 hours to 200 hours** (more than 7 days):
   ```typescript
   if (isTokenExpiringSoon(token, 200)) { // Will always trigger for 7-day tokens
   ```

4. **Save and reload**

5. **Console will show:**
   ```
   🔄 Token expiring soon, auto-refreshing... Time left: 6d 23h
   ✅ Token auto-refreshed successfully! New expiry: 7d 0h
   ```

---

### **Method 3: Simulate Token Expiry (Backend Change)**

**⚠️ ADVANCED - Requires backend access**

1. **Open** `eco-swift-chemist-api/includes/class-token-service.php`

2. **Find line 12** (get_jwt_expire):
   ```php
   $expire = Settings::get_jwt_expire();
   ```

3. **Check** `includes/class-settings.php` for the expire value

4. **Temporarily change to 1 minute**:
   ```php
   public static function get_jwt_expire() {
       return 60; // 1 minute instead of 7 days
   }
   ```

5. **Login again** (to get a token that expires in 1 minute)

6. **Wait 30 seconds** and make an API call

7. **Token should auto-refresh before the 1-minute mark**

---

## 📊 **What to Look For in Console**

### **Successful Auto-Refresh:**
```
🔄 Token expiring soon, auto-refreshing... Time left: 1d 23h
✅ Token auto-refreshed successfully! New expiry: 7d 0h
```

### **Token Still Fresh:**
```
✅ Token still fresh, time remaining: 6d 15h
```

### **Refresh Failed:**
```
❌ Token refresh failed: {error details}
```

---

## 🎯 **Production Settings (After Testing)**

### **Reset to Production Values:**

**In `src/App.tsx`:**

1. **Line 33** - Set expiring threshold:
   ```typescript
   if (isTokenExpiringSoon(token, 48)) { // Refresh if < 2 days remaining
   ```

2. **Line 69** - Set refresh interval:
   ```typescript
   const refreshInterval = setInterval(refreshToken, 6 * 60 * 60 * 1000); // Every 6 hours
   ```

---

## 🔍 **Verify Token Refresh is Working**

### **Check localStorage:**

1. Open browser DevTools → Application → Local Storage
2. Find `eco_swift_token`
3. Copy the token
4. Go to [jwt.io](https://jwt.io)
5. Paste token
6. Check the `exp` field in payload
7. Compare before and after refresh - `exp` should increase by 7 days (604800 seconds)

### **Console Commands for Testing:**

```javascript
// Check current token expiry
const token = localStorage.getItem('eco_swift_token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiry = new Date(payload.exp * 1000);
console.log('Token expires:', expiry);

// Check time remaining
const now = Math.floor(Date.now() / 1000);
const remaining = payload.exp - now;
console.log('Seconds remaining:', remaining);
console.log('Hours remaining:', (remaining / 3600).toFixed(1));
console.log('Days remaining:', (remaining / 86400).toFixed(1));
```

---

## ✅ **Test Scenarios**

### **Scenario 1: Daily User (Never expires)**
- User logs in
- Uses app daily
- Token refreshes every 6 hours
- **Result**: Token never expires ✅

### **Scenario 2: Weekly User**
- User logs in
- Uses app once a week
- Token expires after 7 days of inactivity
- **Result**: Redirected to login ✅

### **Scenario 3: Active Session**
- User logged in and actively using
- Token expires within 48 hours
- Auto-refresh happens in background
- **Result**: Seamless experience ✅

---

## 🐛 **Troubleshooting**

### **Refresh not happening?**
1. Check console for errors
2. Verify `/auth/refresh` endpoint exists on backend
3. Check token is valid (not already expired)
4. Verify network requests in DevTools → Network tab

### **Token still expiring?**
1. Increase the threshold: `isTokenExpiringSoon(token, 96)` (4 days)
2. Decrease interval: `setInterval(refreshToken, 3 * 60 * 60 * 1000)` (3 hours)

### **Getting 401 errors?**
1. Token might be completely expired
2. Backend `/auth/refresh` might be down
3. Check if token exists in localStorage

---

## 🚀 **Ready for Production!**

Once testing is complete:

1. ✅ Set refresh interval to **6 hours**
2. ✅ Set expiring threshold to **48 hours** (2 days)
3. ✅ Remove all console.logs (or keep for debugging)
4. ✅ Deploy and monitor

---

## 📞 **Quick Test Commands**

Run these in browser console for instant testing:

```javascript
// Force immediate refresh test
const token = localStorage.getItem('eco_swift_token');
fetch('https://embolo.in/wp-json/eco-swift/v1/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => {
  if(d.success) {
    console.log('✅ Refresh works!', d.token);
    localStorage.setItem('eco_swift_token', d.token);
  }
});
```

**Happy Testing! 🎉**
