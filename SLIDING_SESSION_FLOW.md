# 🔄 Sliding Session Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLIDING SESSION TOKEN FLOW                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User Login │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Backend Generates    │
│ JWT Token            │
│ Expiry: NOW + 7 days │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Frontend Stores      │
│ localStorage.setItem │
│ ('eco_swift_token')  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                   USER MAKES API CALL                     │
│  (Browse products, Create order, View orders, etc.)      │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: axios.interceptors.request                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ config.headers.Authorization = `Bearer ${token}`        │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND: determine_current_user filter                       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 1. Extract token from Authorization header              │ │
│ │ 2. Validate signature                                   │ │
│ │ 3. Check expiration                                     │ │
│ │ 4. Store original token in global variable              │ │
│ │ 5. Return user_id                                       │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ API ENDPOINT PROCESSES REQUEST                               │
│ (Create order, Get products, etc.)                           │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND: rest_pre_serve_request filter                       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 1. Check if user was authenticated via JWT              │ │
│ │ 2. Get user from original token                         │ │
│ │ 3. Generate NEW token (exp = NOW + 7 days)              │ │
│ │ 4. Add header: X-JWT-Token: {new_token}                 │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ RESPONSE SENT TO FRONTEND                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Headers:                                                │ │
│ │   X-JWT-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6...         │ │
│ │                                                         │ │
│ │ Body: {success: true, data: {...}}                      │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: axios.interceptors.response                        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 1. Check response.headers['x-jwt-token']                │ │
│ │ 2. If exists:                                           │ │
│ │    - localStorage.setItem('eco_swift_token', newToken) │ │
│ │    - console.log('🔄 Token extended!')                  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ TOKEN NOW VALID FOR 7 MORE DAYS                              │
│ User can make another API call anytime                       │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
   ┌───────┐
   │ LOOP  │ ← User makes another API call, cycle repeats
   └───────┘


┌─────────────────────────────────────────────────────────────┐
│                    INACTIVITY SCENARIO                       │
└─────────────────────────────────────────────────────────────┘

Day 1: Login → Token expires in 7 days
Day 2-6: No API calls → Token unchanged
Day 7: Still no API calls → Token expires tomorrow
Day 8: User returns → Token expired → Redirect to /login ✅


┌─────────────────────────────────────────────────────────────┐
│                    ACTIVE USER SCENARIO                      │
└─────────────────────────────────────────────────────────────┘

Day 1: Login → Token expires Day 8
Day 2: Browse products → Token extends to Day 9
Day 3: Create order → Token extends to Day 10
Day 4: View orders → Token extends to Day 11
...
Day 100: Still active → Token extends to Day 107 ✅
Result: Stays logged in forever!


┌─────────────────────────────────────────────────────────────┐
│                  COMPARISON: OLD vs NEW                      │
└─────────────────────────────────────────────────────────────┘

OLD (Background Refresh):
┌──────────────────────────────────────────────────────────┐
│ useEffect runs every 6 hours                             │
│ ├─ Check: token expires within 48h?                      │
│ │   ├─ YES → Call /auth/refresh endpoint                │
│ │   │   ├─ Success → Update localStorage                │
│ │   │   └─ Fail → Log error                             │
│ │   └─ NO → Do nothing                                   │
│ ⚠️ Issues:                                               │
│   - Missed refreshes if app closed                       │
│   - Edge cases with 48h threshold                        │
│   - Extra API call just for refresh                      │
└──────────────────────────────────────────────────────────┘

NEW (Sliding Session):
┌──────────────────────────────────────────────────────────┐
│ On EVERY API call:                                       │
│ ├─ Backend generates new token automatically            │
│ ├─ Frontend captures from response header               │
│ └─ localStorage updates instantly                        │
│ ✅ Benefits:                                             │
│   - No missed refreshes                                  │
│   - No edge cases                                        │
│   - No extra API calls                                   │
│   - Completely automatic                                 │
└──────────────────────────────────────────────────────────┘
```

## 🔑 **Key Takeaways**

1. **Every API call = Token refresh** ✅
2. **No background timers needed** ✅
3. **Works seamlessly** ✅
4. **User stays logged in while active** ✅
5. **Auto logout after 7 days inactivity** ✅
