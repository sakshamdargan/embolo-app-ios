# Embolo Cashback System Plugin

A comprehensive dopamine-driven cashback system for the Embolo B2B platform that integrates seamlessly with the eco-swift-chemist-api plugin.

## 🚀 Features

### Backend (WordPress Plugin)
- **Dopamine-Driven Algorithm**: ₹0-₹60 cashback range with streak-based rewards
- **JWT Authentication**: Seamless integration with eco-swift-chemist-api
- **Database Management**: 3 optimized tables for cashback, wallets, and streaks
- **REST API Endpoints**: Complete API for cashback and wallet operations
- **Admin Dashboard**: Bulk approval, statistics, and settings management
- **Email Notifications**: Beautiful HTML email templates for approvals
- **WooCommerce Integration**: Automatic order event handling

### Frontend (React Components)
- **Animated Cashback Popup**: Rocket launch with confetti celebration
- **Wallet Dashboard**: Complete balance overview and transaction history
- **Streak Tracking**: Milestone progress and engagement scoring
- **Mobile Responsive**: Optimized for all device sizes
- **Framer Motion Animations**: Smooth, dopamine-triggering animations

## 📋 Requirements

### WordPress Environment
- WordPress 5.8 or higher
- WooCommerce 6.0 or higher
- PHP 7.4 or higher
- MySQL 5.7 or higher

### Dependencies
- **eco-swift-chemist-api plugin** (Required)
- JWT authentication enabled
- WordPress REST API enabled

### Frontend Dependencies
- React 18+
- Framer Motion 11+
- Canvas Confetti 1.9+
- Axios for API calls

## 🛠️ Installation

### Step 1: Install WordPress Plugin

1. **Upload Plugin Files**
   ```bash
   # Copy the plugin folder to WordPress plugins directory
   cp -r embolo-cashback-system /path/to/wordpress/wp-content/plugins/
   ```

2. **Activate Plugin**
   - Go to WordPress Admin → Plugins
   - Find "Embolo Cashback System"
   - Click "Activate"

3. **Verify Dependencies**
   - Ensure eco-swift-chemist-api is active
   - Plugin will show error if dependencies are missing

### Step 2: Database Setup

The plugin automatically creates required tables on activation:
- `wp_embolo_cashback` - Cashback entries with status tracking
- `wp_embolo_wallets` - User wallet balances and lifetime stats  
- `wp_embolo_user_streaks` - Streak tracking and engagement scoring

### Step 3: Frontend Integration

1. **Install Frontend Dependencies**
   ```bash
   npm install framer-motion@^11.11.17 canvas-confetti@^1.9.3
   npm install @types/canvas-confetti@^1.6.4 --save-dev
   ```

2. **Copy React Components**
   - Copy all files from `src/` to your React app
   - Components are in `src/components/cashback/`
   - Services are in `src/services/`
   - Hooks are in `src/hooks/`

3. **Update App Routes**
   ```typescript
   // Add to your App.tsx
   import Wallet from "./pages/Wallet";
   
   // Add route
   <Route path="/wallet" element={<Wallet />} />
   ```

4. **Integrate Checkout**
   ```typescript
   // Add to your Checkout.tsx
   import CashbackIntegration from '@/components/cashback/CashbackIntegration';
   
   // Add component
   <CashbackIntegration 
     orderValue={getTotalPrice()}
     showPreview={true}
   />
   ```

## ⚙️ Configuration

### WordPress Admin Settings

1. **Navigate to Cashback Settings**
   - WordPress Admin → Cashback System → Settings

2. **Configure Options**
   ```
   Enable Cashback System: ✓ Yes
   Minimum Cashback Amount: ₹0
   Maximum Cashback Amount: ₹60
   Auto-Approve Cashbacks: ☐ No (recommended)
   ```

### JWT Authentication

Ensure JWT is properly configured in eco-swift-chemist-api:
```php
// wp-config.php
define('JWT_SECRET', 'your-secret-key-here');
```

### API Endpoints

The plugin registers these REST API endpoints:

#### Cashback Endpoints
- `GET /wp-json/embolo/v1/cashback/order/{id}` - Get order cashback
- `GET /wp-json/embolo/v1/cashback/preview` - Get cashback preview
- `GET /wp-json/embolo/v1/cashback/history` - Get cashback history
- `POST /wp-json/embolo/v1/cashback/process` - Process cashback

#### Wallet Endpoints
- `GET /wp-json/embolo/v1/wallet` - Get wallet details
- `GET /wp-json/embolo/v1/wallet/transactions` - Get transactions
- `GET /wp-json/embolo/v1/wallet/stats` - Get wallet statistics

## 🎯 Cashback Algorithm

### Streak-Based Rewards
- **Day 1-2**: ₹50 (Initial excitement)
- **Day 3**: ₹30 (Normalized)
- **Day 4**: ₹25 (Controlled)
- **Day 5**: ₹60 (Loyalty bonus)
- **Day 7+**: Dynamic rewards with milestones

### Comeback Bonuses
- **2-7 days gap**: ₹40-₹45 comeback bonus
- **Longer gaps**: Fresh start rewards ₹20-₹35

### Order Value Modifiers
- **₹5000+**: +₹5-₹15 high-value bonus
- **₹2000+**: +₹2-₹8 medium-value bonus

### Engagement Scoring
- **0-10 scale** based on consistency and loyalty
- **8.0+**: High engagement bonus +₹3-₹8
- **6.0+**: Medium engagement bonus +₹1-₹4

### Random Dopamine Spikes
- **5% chance**: Surprise bonus +₹10-₹20
- **Ultra-loyalty (50+ streak)**: +₹5-₹15

## 🎨 Frontend Integration

### Cashback Popup Usage

```typescript
// Trigger popup after successful order
const orderId = response.data?.id;
if (orderId && (window as any).triggerCashbackPopup) {
  (window as any).triggerCashbackPopup(orderId);
}
```

### Wallet Page Features

- **Balance Overview**: Current balance and lifetime earned
- **Transaction History**: Filterable by status with pagination
- **Streak Tracking**: Current streak and milestone progress
- **Statistics**: Engagement score and performance metrics

### Cashback Preview

```typescript
<CashbackIntegration 
  orderValue={getTotalPrice()}
  showPreview={true}
  onOrderPlaced={(orderId) => {
    // Handle order placement
  }}
/>
```

## 🔧 Admin Management

### Dashboard Features
- **Statistics Overview**: Total cashbacks, pending approvals, wallet balances
- **Pending Approvals**: Bulk approve/reject functionality
- **All Cashbacks**: Complete transaction history
- **Settings**: System configuration options

### Bulk Actions
```javascript
// Approve all pending cashbacks
emboloBulkApproveAll();

// Bulk approve selected
emboloBulkAction('approve');

// Bulk reject with reason
emboloBulkAction('reject');
```

## 📧 Email Notifications

### Cashback Approved Email
- Beautiful HTML template with gradient design
- Order details and cashback amount
- Call-to-action to view wallet
- Mobile-responsive design

### Cashback Processed Email
- Notification when cashback is calculated
- Pending approval status indication
- Order information included

### Admin Notifications
- Email alerts for new pending cashbacks
- Bulk action completion notifications

## 🔒 Security Features

- **JWT Token Validation**: All API endpoints secured
- **WordPress Nonces**: Admin actions protected
- **Input Sanitization**: All user inputs validated
- **Prepared SQL Statements**: Database queries secured
- **Role-Based Access**: Customer role verification

## 📱 Mobile Optimization

### Responsive Design
- **Breakpoints**: xs (375px), sm (640px), md (768px), lg (1024px)
- **Touch Targets**: Optimized for mobile interaction
- **Animations**: Reduced motion support for accessibility
- **Performance**: Optimized for mobile networks

### iPhone 13 Pro Compatibility
- **Ultra-responsive components**: Perfect fit on 390px width
- **Touch-friendly interface**: Proper spacing and sizing
- **Smooth animations**: 60fps performance target

## 🚀 Performance Optimization

### Database Optimization
- **Indexed Queries**: Optimized for fast retrieval
- **Efficient Joins**: Minimal database calls
- **Caching**: WordPress object cache integration
- **Cleanup**: Automatic old data cleanup

### Frontend Performance
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React hooks optimized
- **Bundle Splitting**: Separate cashback bundle
- **Animation Performance**: GPU-accelerated animations

## 🐛 Troubleshooting

### Common Issues

#### 1. Plugin Activation Error
```
Error: eco-swift-chemist-api plugin required
```
**Solution**: Activate eco-swift-chemist-api plugin first

#### 2. JWT Authentication Failed
```
Error: You are not currently logged in
```
**Solution**: Check JWT_SECRET in wp-config.php and token validity

#### 3. Database Tables Not Created
```
Error: Table 'wp_embolo_cashback' doesn't exist
```
**Solution**: Deactivate and reactivate plugin to trigger table creation

#### 4. Frontend Components Not Loading
```
Error: Cannot find module 'framer-motion'
```
**Solution**: Install required dependencies
```bash
npm install framer-motion canvas-confetti
```

#### 5. Cashback Not Calculating
**Check**: 
- Plugin is enabled in settings
- User has customer role
- Order status is 'processing' or 'completed'
- No existing cashback for the order

### Debug Mode

Enable WordPress debug mode for detailed error logs:
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check logs at: `/wp-content/debug.log`

### API Testing

Test endpoints using curl:
```bash
# Get cashback preview
curl -X GET "https://yoursite.com/wp-json/embolo/v1/cashback/preview?order_value=1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get wallet details
curl -X GET "https://yoursite.com/wp-json/embolo/v1/wallet" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Monitoring & Analytics

### Admin Dashboard Metrics
- Total cashbacks processed
- Pending approval count
- Average cashback amount
- User engagement scores
- Wallet balance statistics

### Performance Monitoring
- API response times
- Database query performance
- Frontend animation performance
- Mobile user experience metrics

## 🔄 Updates & Maintenance

### Plugin Updates
- Check for updates in WordPress admin
- Backup database before major updates
- Test in staging environment first

### Database Maintenance
- Monitor table sizes and performance
- Clean up old processed entries
- Optimize database indexes regularly

### Frontend Updates
- Keep dependencies updated
- Monitor bundle size
- Test across different devices

## 📞 Support

### Documentation
- Complete API documentation in code comments
- Inline help text in admin interface
- Error messages with actionable solutions

### Debugging Tools
- Comprehensive error logging
- Admin debug information panel
- API endpoint testing tools

## 🎉 Success Metrics

### User Engagement
- **Increased Order Frequency**: Streak-based rewards encourage daily orders
- **Higher Customer Retention**: Dopamine-driven algorithm keeps users engaged
- **Improved User Experience**: Smooth animations and instant feedback

### Business Impact
- **Reduced Customer Acquisition Cost**: Algorithm optimizes rewards for retention
- **Increased Order Values**: Value-based bonuses encourage larger orders
- **Better Customer Loyalty**: Long-term engagement through milestone rewards

---

## 🏆 Conclusion

The Embolo Cashback System is a production-ready, comprehensive solution that seamlessly integrates with your existing eco-swift platform. With its dopamine-driven algorithm, beautiful animations, and robust admin tools, it's designed to maximize user engagement while optimizing business metrics.

**Ready to boost your customer retention? Activate the plugin and watch your engagement soar! 🚀**
