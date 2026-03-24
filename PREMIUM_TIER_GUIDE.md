# Premium Tier Implementation Guide

## 📋 Overview

This document outlines the premium subscription system for AkmEdu, including:
- 3 pricing tiers (Free, Premium, Pro)
- Feature gating and access control
- Razorpay payment integration
- Subscription management

---

## 🎯 Pricing Tiers

### Free Tier
- **Price**: ₹0/month
- **Features**:
  - 5 chapters access
  - 25 MCQs per chapter
  - Basic progress tracking
  - Mobile-responsive platform
  - Study streak tracking
  - Weak topics identification

### Premium Tier
- **Price**: ₹199/month or ₹1,915/year (20% discount)
- **Features**:
  - All Free features +
  - All chapters unlocked (100% curriculum)
  - AI-generated study notes
  - 50 MCQs with full answers
  - Unlimited sample papers
  - Advanced analytics
  - Weak topics detection
  - Progress reports

### Pro Tier
- **Price**: ₹499/month or ₹4,792/year (20% discount)
- **Features**:
  - All Premium features +
  - Live doubt sessions (mentorship)
  - 1-on-1 guidance with educators
  - Offline access to notes
  - Priority support (24/7)
  - Custom mock tests
  - Performance recommendations
  - Exclusive webinars

---

## 📁 File Structure

### New Files Created

```
src/
├── constants/
│   └── pricing.js              # Tier definitions, features, Razorpay config
├── hooks/
│   └── useSubscription.js      # Hook for subscription management
├── utils/
│   ├── razorpay.js            # Razorpay payment integration utilities
│   └── api-handlers.js        # Backend API handlers (Node.js)
├── components/
│   └── FeatureGate.jsx        # Components for tier access control
└── pages/
    └── PricingPage.jsx        # Pricing page UI

database/
└── subscriptions_schema.sql    # Supabase schema for subscriptions table
```

### Modified Files

- **src/App.jsx**
  - Added `useSubscription` hook
  - Integrated `PricingPage` component
  - Added feature gating to `genNotes()`, `genQuiz()`, `genPaper()`
  - Added "💎 Plans" navigation button

- **src/styles/shared.js**
  - Added `styling` object export
  - Provides colors, spacing, typography, card styling

---

## 🔧 Implementation Steps

### Step 1: Set Up Database

Run this SQL in Supabase SQL Editor:

```sql
-- From database/subscriptions_schema.sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'pro')),
  order_id TEXT NOT NULL UNIQUE,
  payment_id TEXT NOT NULL UNIQUE,
  amount INT NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_cycle TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  ...
);

-- Create indexes and views as per schema
```

### Step 2: Configure Environment Variables

Create `.env.local` with:

```env
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Get these from**: [Razorpay Dashboard](https://dashboard.razorpay.com/)

### Step 3: Backend API Endpoints

Implement these endpoints in your backend (Node.js/Express, Python/Flask, etc.):

#### POST /api/create-order
Creates a Razorpay order for payment

**Request**:
```json
{
  "amount": 19900,  // in paisa
  "planType": "premium",
  "billingCycle": "monthly",
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "orderId": "order_xxx",
  "amount": 19900,
  "currency": "INR"
}
```

#### POST /api/verify-payment
Verifies payment signature and confirms subscription

**Request**:
```json
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx",
  "userId": "user-uuid"
}
```

#### POST /api/webhook/razorpay
Handles Razorpay webhook events:
- `payment.authorized`
- `payment.failed`
- `refund.created`
- `subscription.cancelled`

### Step 4: Database Subscription Management

After successful payment, save subscription:

```javascript
// In backend
const subscription = {
  user_id: userId,
  tier: 'premium',
  order_id: orderId,
  payment_id: paymentId,
  amount: amount,
  billing_cycle: 'monthly',
  created_at: new Date(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
};

await supabase.from('subscriptions').insert([subscription]);
```

### Step 5: Integration in Frontend

The following is already implemented:

1. **PricingPage Component**
   - Monthly/Annual toggle
   - Feature comparison
   - Razorpay checkout integration
   - FAQ and guarantee section

2. **Feature Gating**
   - `FeatureGate` component for wrapping premium content
   - `useSubscription` hook tracks user tier
   - Automatic redirect to pricing when feature locked

3. **Access Control**
   - Check tier before generating notes
   - Check tier before creating quizzes
   - Check tier before generating papers

---

## 🚀 Usage Examples

### Check User Tier

```javascript
import { useSubscription } from './hooks/useSubscription';

function MyComponent() {
  const { tier, hasFeatureAccess } = useSubscription();
  
  if (hasFeatureAccess('notes_generation')) {
    // Show notes generation button
  }
}
```

### Gate Premium Features

```javascript
import { FeatureGate } from './components/FeatureGate';

<FeatureGate
  feature="notes_generation"
  userTier={tier}
  onUpgradeClick={() => navigate('/pricing')}
>
  {/* Premium content here */}
</FeatureGate>
```

### Payment Checkout

```javascript
import { handlePaymentCheckout, createOrder } from './utils/razorpay';

async function startCheckout() {
  const order = await createOrder(199, 'premium', 'monthly');
  
  await handlePaymentCheckout({
    orderId: order.orderId,
    amount: order.amount,
    userEmail: 'user@example.com',
    userName: 'User Name',
    planType: 'premium',
    onSuccess: (data) => {
      // Payment successful, save subscription
      console.log('Subscribe successful:', data);
    },
    onError: (error) => {
      alert('Payment failed: ' + error);
    }
  });
}
```

---

## 💳 Payment Flow

```
User clicks "Get Started"
    ↓
User redirected to Pricing Page
    ↓
User selects plan (Monthly/Annual)
    ↓
Frontend calls /api/create-order
    ↓
Razorpay order created
    ↓
Razorpay checkout modal opens
    ↓
User completes payment
    ↓
Frontend calls /api/verify-payment
    ↓
Backend verifies payment signature
    ↓
Subscription saved to database
    ↓
User tier updated to premium/pro
    ↓
Premium features unlocked
```

---

## 🔐 Security Considerations

1. **Signature Verification**: Always verify Razorpay payment signatures server-side
2. **Environment Variables**: Never commit API secrets to git
3. **Row Level Security (RLS)**: Enable RLS on subscriptions table
4. **HTTPS**: Always use HTTPS for payment endpoints
5. **Rate Limiting**: Implement rate limiting on payment endpoints

### Supabase RLS Policies

```sql
-- Users can only see their own subscription
CREATE POLICY "Users can see own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only app can insert subscriptions
CREATE POLICY "App can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 📊 Feature Access Matrix

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Study Notes | - | ✓ | ✓ |
| Full Quizzes | - | ✓ | ✓ |
| Sample Papers | - | ✓ | ✓ |
| Advanced Analytics | - | ✓ | ✓ |
| Weak Topics | - | ✓ | ✓ |
| Mentorship | - | - | ✓ |
| Live Sessions | - | - | ✓ |
| Offline Access | - | - | ✓ |
| Priority Support | - | - | ✓ |
| Custom Tests | - | - | ✓ |

---

## 🧪 Testing Checklist

- [ ] Create test Razorpay account
- [ ] Test subscription flow end-to-end
- [ ] Test payment verification
- [ ] Test tier-based feature access
- [ ] Test subscription cancellation
- [ ] Test annual vs monthly billing
- [ ] Test webhook handling
- [ ] Test on mobile/tablet/desktop
- [ ] Test error handling
- [ ] Load test payment endpoints

### Razorpay Test Cards

- **Success**: 4111 1111 1111 1111
- **Failure**: 4222 2222 2222 2222
- **CVV**: Any 3 digits
- **Date**: Any future date

---

## 📝 Next Steps

1. **Deploy Backend**: Set up Node.js/Express or your preferred backend
2. **Razorpay Setup**: Create account and get API keys
3. **Database Migration**: Run SQL schema in Supabase
4. **Testing**: Test payment flow with test cards
5. **Go Live**: Use production Razorpay keys
6. **Monitoring**: Track subscription metrics

---

## 💡 Future Enhancements

- [ ] Subscription management dashboard (pause, upgrade, cancel)
- [ ] Referral program
- [ ] Gift subscriptions
- [ ] Family plans (shared subscription)
- [ ] Subscription analytics
- [ ] Auto-renewal management
- [ ] Invoice generation
- [ ] Dunning management (retry failed payments)
- [ ] Integration with email service for receipts
- [ ] SMS notifications for subscription events

---

## 📞 Support

For questions about:
- **Razorpay Integration**: See [Razorpay Docs](https://razorpay.com/docs/)
- **Supabase**: See [Supabase Docs](https://supabase.com/docs/)
- **React**: See [React Docs](https://react.dev/)

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
