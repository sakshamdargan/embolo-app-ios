# 🚀 Quick Reference: Sliding Session Token

## ⚡ **TL;DR**

Every API call = Token extends by 7 days  
Active users = Logged in forever  
Inactive 7+ days = Auto logout

---

## 📍 **Testing Location**

**File**: `eco-swift-chemist-api/includes/class-settings.php`  
**Line**: 35  
**Function**: `get_jwt_expire()`

```php
// PRODUCTION (current)
return get_option('jwt_auth_expire', 7 * DAY_IN_SECONDS);

// TESTING (1 minute)
return 60;
```

---

## 🔍 **What to Look For**

### **Browser Console**:
```
🔄 Token extended! Updating localStorage...
```

### **Network Tab**:
Response Headers:
```
x-jwt-token: eyJhbGc...
```

### **localStorage**:
```javascript
const token = localStorage.getItem('eco_swift_token');
const exp = JSON.parse(atob(token.split('.')[1])).exp;
console.log('Expires:', new Date(exp * 1000));
```

---

## 📁 **Files Changed**

✅ Backend:
- `eco-swift-chemist-api/eco-swift-chemist-api.php`

✅ Frontend:
- `src/services/orderService.ts`
- `src/services/productService.ts`
- `src/services/addressService.ts`
- `src/App.tsx` (removed background refresh)

---

## 🧪 **Quick Test**

1. Change line 35 in `class-settings.php` to `return 60;`
2. Login
3. Wait 30 seconds
4. Make any API call
5. Check console for `🔄 Token extended!`
6. **Restore to `return get_option(...)`!**

---

## ✅ **Production Ready**

No changes needed. Works automatically!
