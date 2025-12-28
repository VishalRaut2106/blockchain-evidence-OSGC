# 📊 Google Analytics Setup Guide for EVID-DGC

This guide will help you set up Google Analytics to monitor your blockchain evidence management system.

## 🚀 Quick Setup

### 1. Create Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring"
4. Create a new account for your organization

### 2. Set Up Property
1. Enter property name: "EVID-DGC Evidence System"
2. Select your reporting time zone
3. Select your currency
4. Choose "Web" as the platform
5. Enter your website URL (e.g., `https://your-domain.com`)
6. Enter stream name: "EVID-DGC Web Stream"

### 3. Get Your Measurement ID
1. After creating the property, you'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
2. Copy this ID - you'll need it for configuration

### 4. Configure the System
1. Open `public/analytics.js`
2. Replace `'G-XXXXXXXXXX'` with your actual Measurement ID:
   ```javascript
   const GA_MEASUREMENT_ID = 'G-YOUR-ACTUAL-ID'; // Replace with your GA4 Measurement ID
   ```

### 5. Deploy and Test
1. Deploy your application
2. Visit your site and navigate through different pages
3. Check Google Analytics (data may take 24-48 hours to appear)

## 📈 What Gets Tracked

### Automatic Tracking
- ✅ Page views on all HTML pages
- ✅ User sessions and engagement
- ✅ Geographic data
- ✅ Device and browser information
- ✅ Traffic sources

### Custom Events (Available)
- 🔐 User login/logout actions
- 👤 User registration by role
- 📁 Case creation and management
- 📋 Evidence uploads
- 🔍 Search queries
- ⚖️ Admin actions

## 🛠️ Custom Event Tracking

You can track custom events using the provided functions:

```javascript
// Track user actions
trackUserAction('user_login', 'authentication');
trackUserAction('case_created', 'case_management');
trackUserAction('evidence_uploaded', 'evidence_management');

// Track specific events with parameters
trackEvent('role_selected', {
    event_category: 'registration',
    role_type: 'investigator',
    user_type: 'new_user'
});

// Track page views
trackPageView('Admin Dashboard');
```

## 📊 Recommended Dashboard Setup

### Key Metrics to Monitor
1. **User Engagement**
   - Active users by role
   - Session duration
   - Pages per session

2. **System Usage**
   - Most visited dashboards
   - Feature usage by role
   - Peak usage times

3. **Security Monitoring**
   - Login attempts
   - Failed authentications
   - Admin actions

### Custom Dimensions (Optional)
Set up these custom dimensions in GA4:
- User Role (investigator, analyst, admin, etc.)
- Account Type (real, test)
- Department
- Jurisdiction

## 🔒 Privacy Considerations

### Data Protection
- ✅ No personally identifiable information (PII) is tracked
- ✅ Wallet addresses are anonymized
- ✅ Case details are not sent to Analytics
- ✅ Evidence content is never tracked

### GDPR Compliance
- Consider adding a cookie consent banner
- Provide opt-out mechanisms
- Document data collection in privacy policy

## 🚨 Security Notes

### What NOT to Track
- ❌ Wallet private keys
- ❌ Case sensitive details
- ❌ Evidence content
- ❌ Personal information
- ❌ Authentication tokens

### Best Practices
- ✅ Use generic event names
- ✅ Anonymize user identifiers
- ✅ Regular audit of tracked data
- ✅ Limit access to Analytics account

## 🔧 Advanced Configuration

### Enhanced Ecommerce (Optional)
Track case lifecycle as conversion funnel:
```javascript
// Track case creation as conversion
gtag('event', 'purchase', {
    transaction_id: caseId,
    value: 1,
    currency: 'USD',
    items: [{
        item_id: caseId,
        item_name: 'Evidence Case',
        category: crimeType,
        quantity: 1,
        price: 1
    }]
});
```

### Custom Reports
Create custom reports for:
- Role-based usage patterns
- Department activity
- System performance metrics
- User journey analysis

## 📞 Support

### Troubleshooting
1. **Data not appearing**: Wait 24-48 hours for initial data
2. **Events not tracking**: Check browser console for errors
3. **Wrong measurement ID**: Verify ID in `analytics.js`

### Resources
- [Google Analytics Help Center](https://support.google.com/analytics/)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Custom Events Documentation](https://developers.google.com/analytics/devguides/collection/ga4/events)

---

**🔐 Monitor your evidence management system securely with Google Analytics** 📊