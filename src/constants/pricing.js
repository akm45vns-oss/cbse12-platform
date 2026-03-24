// Premium Tiers & Pricing Configuration
export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Forever',
    description: 'Perfect for getting started',
    color: '#0891b2',
    features: [
      '✅ Access to 5 chapters per subject',
      '✅ Basic quiz (25 questions)',
      '✅ 1 sample paper per subject',
      '✅ Community forum',
      '✅ Progress tracking',
      '✅ Basic analytics',
      '❌ AI note generation',
      '❌ Full quiz access (50 questions)',
      '❌ Unlimited sample papers',
      '❌ Advanced analytics',
      '❌ Priority support',
    ],
    cta: 'Get Started',
    ctaStyle: 'outline',
    popular: false,
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 199,
    originalPrice: 299,
    period: 'per month',
    description: 'Best for regular students',
    color: '#06b6d4',
    features: [
      '✅ Access to all chapters',
      '✅ Full AI note generation',
      '✅ 50-question quizzes',
      '✅ Unlimited sample papers',
      '✅ Community forum + direct Q&A',
      '✅ Advanced progress analytics',
      '✅ Weak topics analysis',
      '✅ Study recommendations',
      '✅ Dark mode',
      '❌ Expert mentorship',
      '❌ Offline access',
    ],
    cta: 'Subscribe Now',
    ctaStyle: 'solid',
    popular: true,
    badge: 'Most Popular',
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 499,
    originalPrice: 699,
    period: 'per month',
    description: 'For serious board exam prep',
    color: '#0284c7',
    features: [
      '✅ Everything in Premium',
      '✅ 1-on-1 expert mentorship',
      '✅ Weekly live Q&A sessions',
      '✅ Personalized study plan',
      '✅ Custom mock tests',
      '✅ Priority email support',
      '✅ Offline content download',
      '✅ Advanced AI explanations',
      '✅ Performance predictions',
      '✅ Board exam tips & tricks',
      '✅ Certificate of completion',
    ],
    cta: 'Start Pro Trial',
    ctaStyle: 'solid',
    popular: false,
    badge: 'Premium Experience',
  },
};

export const ANNUAL_DISCOUNT = 0.20; // 20% discount for annual

export const PAYMENT_CONFIG = {
  razorpay_key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_YOUR_KEY',
  currency: 'INR',
  description_prefix: 'AkmEdu Subscription -',
};

// Feature access matrix
export const FEATURE_ACCESS = {
  notes_generation: ['premium', 'pro'],
  full_quiz: ['premium', 'pro'],
  sample_papers_unlimited: ['premium', 'pro'],
  analytics_advanced: ['premium', 'pro'],
  weak_topics: ['premium', 'pro'],
  mentorship: ['pro'],
  live_sessions: ['pro'],
  offline_access: ['pro'],
  priority_support: ['pro'],
  custom_tests: ['pro'],
  performance_predictions: ['pro'],
};

// Subscription plans for database
export const SUBSCRIPTION_PLANS = {
  monthly_premium: {
    plan_id: 'monthly_premium',
    tier: 'premium',
    amount: 199 * 100, // In paise
    currency: 'INR',
    duration: 30,
    description: 'AkmEdu Premium Monthly',
  },
  annual_premium: {
    plan_id: 'annual_premium',
    tier: 'premium',
    amount: Math.floor(199 * 12 * 0.8 * 100), // 20% discount
    currency: 'INR',
    duration: 365,
    description: 'AkmEdu Premium Annual (20% Off)',
  },
  monthly_pro: {
    plan_id: 'monthly_pro',
    tier: 'pro',
    amount: 499 * 100,
    currency: 'INR',
    duration: 30,
    description: 'AkmEdu Pro Monthly',
  },
  annual_pro: {
    plan_id: 'annual_pro',
    tier: 'pro',
    amount: Math.floor(499 * 12 * 0.8 * 100), // 20% discount
    currency: 'INR',
    duration: 365,
    description: 'AkmEdu Pro Annual (20% Off)',
  },
};
