# 🔄 Sliding Session Token Extension - Testing Guide

## ✅ Implementation Complete!

Your app now uses **sliding session expiration** - the token extends by 7 days on EVERY API call!

---

## 🎯 How It Works

### **Backend** (`eco-swift-chemist-api.php`)
- Every authenticated API request triggers the `rest_pre_serve_request` filter
- Generates a new JWT token with expiration set to **7 days from now**
- Sends the new token in the response header: `X-JWT-Token`

### **Frontend** (Service interceptors)
- `orderService.ts`, `productService.ts`, `addressService.ts` all have response interceptors
- They capture the `X-JWT-Token` header from every response
- Automatically update `localStorage.setItem('eco_swift_token', newToken)`
- Console logs `🔄 Token extended! Updating localStorage...`

### **Result**
- User stays logged in **forever** as long as they use the app
- If user is inactive for 7+ days, token expires and they're logged out
- No background timers, no manual refresh needed!

---

## 🧪 **Testing Instructions**

### **Method 1: Quick Test (1 minute expiration)**

1. **Open** `eco-swift-chemist-api/includes/class-settings.php`

2. **Find** the `get_jwt_expire()` function:
   ```php
   public static function get_jwt_expire() {
       return 7 * DAY_IN_SECONDS; // 7 days
   }
   ```

3. **Change to 1 minute** for testing:
   ```php
   public static function get_jwt_expire() {
       return 60; // 1 minute = 60 seconds
       // return 7 * DAY_IN_SECONDS; // RESTORE THIS AFTER TESTING
   }
   ```

4. **Login again** (to get a token that expires in 1 minute)

5. **Wait 30 seconds**

6. **Make any API call** (view products, create order, etc.)

7. **Open browser console (F12)** and watch for:
   ```
   🔄 Token extended! Updating localStorage...
   ```

8. **Check localStorage**:
   - Open DevTools → Application → Local Storage
   - Find `eco_swift_token`
   - Copy and paste at [jwt.io](https://jwt.io)
   - The `exp` field should now be **60 seconds in the future**

9. **Repeat steps 6-8** - token should keep extending!

10. **⚠️ IMPORTANT: Restore after testing!**
    ```php
    public static function get_jwt_expire() {
        return 7 * DAY_IN_SECONDS; // Back to 7 days
    }
    ```

---

### **Method 2: Verify Extension on Order Creation**

1. **Login to the app**

2. **Open browser console (F12)**

3. **Add items to cart and create an order**

4. **Watch console output** - you should see:
   ```
   ✅ OrderAPI interceptor - Success response: 200
   🔄 Token extended! Updating localStorage...
   ```

5. **Check token before and after**:
   ```javascript
   // BEFORE ORDER - Run in console
   const token1 = localStorage.getItem('eco_swift_token');
   const exp1 = JSON.parse(atob(token1.split('.')[1])).exp;
   console.log('Before:', new Date(exp1 * 1000));
   
   // CREATE ORDER NOW
   
   // AFTER ORDER - Run in console
   const token2 = localStorage.getItem('eco_swift_token');
   const exp2 = JSON.parse(atob(token2.split('.')[1])).exp;
   console.log('After:', new Date(exp2 * 1000));
   console.log('Extended by:', (exp2 - exp1) / 86400, 'days');
   ```

---

### **Method 3: Check Any API Call**

**Every API call extends the token!** Test with:

- **Browse products** → Token extends
- **View orders** → Token extends  
- **Add/delete address** → Token extends
- **Create order** → Token extends

Open console and watch for the `🔄` emoji!

---

## 📊 **What to Look For**

### **Successful Extension:**
```
🔄 Token extended! Updating localStorage...
```
or
```
🔄 Token extended (product API)! Updating localStorage...
🔄 Token extended (address API)! Updating localStorage...
```

### **Token Details in Console:**
```javascript
// Check current token expiry
const token = localStorage.getItem('eco_swift_token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiry = new Date(payload.exp * 1000);
console.log('Token expires:', expiry);

// Check if extended
const now = new Date();
const hoursLeft = (expiry - now) / (1000 * 60 * 60);
console.log('Hours until expiry:', hoursLeft.toFixed(1));
```

---

## 🎯 **Production Settings**

### **Current Configuration:**
- **Token expiration**: 7 days (set in `class-settings.php`)
- **Extension trigger**: Every authenticated API request
- **Auto-update**: Yes, via axios interceptors

### **No changes needed for production!**
The default 7-day expiration is perfect. Users who:
- Use app daily → Stay logged in forever ✅
- Inactive for 7+ days → Auto logout ✅

---

## 🔍 **Verify Token Extension**

### **Check Network Tab:**
1. Open DevTools → Network tab
2. Make any API call (e.g., browse products)
3. Click on the request
4. Go to **Response Headers**
5. Look for: `x-jwt-token: eyJhbGc...`
6. That's the new extended token!

### **Check localStorage Update:**
```javascript
// Monitor token changes
let oldToken = localStorage.getItem('eco_swift_token');
setInterval(() => {
  const newToken = localStorage.getItem('eco_swift_token');
  if (newToken !== oldToken) {
    console.log('✅ Token updated!');
    console.log('Old exp:', JSON.parse(atob(oldToken.split('.')[1])).exp);
    console.log('New exp:', JSON.parse(atob(newToken.split('.')[1])).exp);
    oldToken = newToken;
  }
}, 1000);
```

---

## ✅ **Test Scenarios**

### **Scenario 1: Daily Active User**
1. User logs in
2. Uses app throughout the day
3. Token keeps extending on every API call
4. **Result**: Never expires! ✅

### **Scenario 2: Weekly User**
1. User logs in
2. Doesn't use app for 8 days
3. Token expires (no API calls to extend it)
4. **Result**: Redirected to login on next visit ✅

### **Scenario 3: Order Creation**
1. User creates an order
2. Token extends by 7 days instantly
3. User can immediately create another order
4. **Result**: No auth failures! ✅

---

## 🐛 **Troubleshooting**

### **Token not extending?**
1. Check browser console for `🔄` emoji
2. Verify `X-JWT-Token` in Network tab response headers
3. Check that you're logged in (token exists in localStorage)
4. Make sure backend file `eco-swift-chemist-api.php` was updated

### **Getting 401 errors?**
1. Token might already be expired
2. Logout and login again to get fresh token
3. Check backend `rest_pre_serve_request` filter is active

### **Console not showing logs?**
1. Make sure you're making authenticated API calls
2. Check that service files have the updated interceptors
3. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## 📍 **Where Time Settings Are**

### **For Testing (Change token duration):**
**File**: `eco-swift-chemist-api/includes/class-settings.php`

**Function**: `get_jwt_expire()`

**Exact Line**: Line 35

**Current code**:
```php
public static function get_jwt_expire() {
    return get_option('jwt_auth_expire', 7 * DAY_IN_SECONDS); // Default 7 days
}
```

**Change to** (for testing):
```php
public static function get_jwt_expire() {
    // return get_option('jwt_auth_expire', 7 * DAY_IN_SECONDS); // ORIGINAL - RESTORE THIS!
    return 60; // 🧪 TESTING: 1 minute
}
```

**Other test values:**
```php
return 60;      // 1 minute
return 300;     // 5 minutes  
return 600;     // 10 minutes
return 3600;    // 1 hour
```

**⚠️ CRITICAL: After testing, restore to:**
```php
public static function get_jwt_expire() {
    return get_option('jwt_auth_expire', 7 * DAY_IN_SECONDS); // Default 7 days
}
```

---

## 🚀 **You're All Set!**

- ✅ Backend extends token on every request
- ✅ Frontend captures and updates token automatically  
- ✅ No background refresh needed
- ✅ Users stay logged in as long as they're active
- ✅ Inactive users auto-logout after 7 days

**Happy Testing! 🎉**
