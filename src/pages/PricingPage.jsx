import React, { useState } from 'react';
import { styling } from '../styles/shared';
import { PRICING_TIERS, SUBSCRIPTION_PLANS } from '../constants/pricing';
import { formatPrice, calculateAnnualPrice } from '../utils/razorpay';

/**
 * Feature highlight component
 */
function FeatureItem({ feature, included }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 0',
      fontSize: 'var(--fs-body)',
      color: included ? '#1f2937' : '#9ca3af',
    }}>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: included ? '#10b981' : '#e5e7eb',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
      }}>
        {included ? '✓' : '✕'}
      </span>
      <span>{feature}</span>
    </div>
  );
}

/**
 * Pricing Tier Card
 */
function PricingCard({ tier, billingCycle, isPopular, onSelectPlan }) {
  const tierData = PRICING_TIERS[tier];
  const plan = SUBSCRIPTION_PLANS[tier];
  
  let price, savings;
  if (billingCycle === 'annual') {
    price = calculateAnnualPrice(plan.monthly_price);
    savings = (plan.monthly_price * 12) - price;
  } else {
    price = plan.monthly_price;
    savings = 0;
  }

  const isFreeTier = tier === 'free';

  return (
    <div style={{
      ...styling.card,
      position: 'relative',
      border: isPopular ? `3px solid ${styling.colors.primary}` : '1px solid #e5e7eb',
      transform: isPopular ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 0.3s ease',
      backgroundColor: isPopular ? '#f0fdf4' : '#fff',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
    }}
    onMouseEnter={(e) => {
      if (!isPopular) e.currentTarget.style.boxShadow = '0 20px 25px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      if (!isPopular) e.currentTarget.style.boxShadow = styling.card.boxShadow;
    }}>
      
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: styling.colors.primary,
          color: 'white',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Most Popular
        </div>
      )}

      {/* Tier Name */}
      <h3 style={{
        fontSize: 'var(--fs-h2)',
        fontWeight: '700',
        marginBottom: '8px',
        color: styling.colors.dark,
        textTransform: 'capitalize',
      }}>
        {tier}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '20px',
        minHeight: '40px',
      }}>
        {tierData.description}
      </p>

      {/* Pricing */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e5e7eb',
      }}>
        {!isFreeTier ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{
                fontSize: '36px',
                fontWeight: '700',
                color: styling.colors.primary,
              }}>
                ₹{Math.floor(price)}
              </span>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
              }}>
                / {billingCycle === 'annual' ? 'year' : 'month'}
              </span>
            </div>
            {savings > 0 && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#92400e',
                fontWeight: '600',
              }}>
                Save ₹{Math.floor(savings)} annually!
              </div>
            )}
          </>
        ) : (
          <span style={{
            fontSize: '28px',
            fontWeight: '700',
            color: styling.colors.primary,
          }}>
            FREE
          </span>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => !isFreeTier && onSelectPlan(tier, billingCycle, price)}
        style={{
          padding: '14px 24px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '15px',
          fontWeight: '600',
          cursor: isFreeTier ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '24px',
          backgroundColor: isFreeTier ? '#f3f4f6' : (isPopular ? styling.colors.primary : styling.colors.secondary),
          color: isFreeTier ? '#6b7280' : 'white',
        }}
        disabled={isFreeTier}
      >
        {isFreeTier ? 'Current Plan' : 'Get Started'}
      </button>

      {/* Features List */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '16px',
        }}>
          Includes:
        </p>
        {tierData.features.map((feature, idx) => (
          <FeatureItem
            key={idx}
            feature={feature}
            included={true}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Main Pricing Page Component
 */
export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = (tier, cycle, price) => {
    setLoading(true);
    // This will trigger payment flow
    console.log(`Selected ${tier} plan (${cycle}) for ₹${price}`);
    // Implement payment integration here
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '60px 20px',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px',
      }}>
        <h1 style={{
          fontSize: 'var(--fs-h1)',
          fontWeight: '700',
          marginBottom: '16px',
          color: styling.colors.dark,
        }}>
          Choose Your Plan
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          maxWidth: '500px',
          margin: '0 auto 40px',
        }}>
          Unlock premium features to accelerate your CBSE Class 12 preparation
        </p>

        {/* Billing Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '40px',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            color: billingCycle === 'monthly' ? styling.colors.primary : '#9ca3af',
          }}>
            <input
              type="radio"
              checked={billingCycle === 'monthly'}
              onChange={() => setBillingCycle('monthly')}
              style={{ cursor: 'pointer' }}
            />
            Monthly
          </label>

          <div style={{
            position: 'relative',
            display: 'flex',
            padding: '4px',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
                color: billingCycle === 'monthly' ? styling.colors.primary : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: billingCycle === 'annual' ? 'white' : 'transparent',
                color: billingCycle === 'annual' ? styling.colors.primary : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Annual
            </button>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            color: billingCycle === 'annual' ? styling.colors.primary : '#9ca3af',
          }}>
            <input
              type="radio"
              checked={billingCycle === 'annual'}
              onChange={() => setBillingCycle('annual')}
              style={{ cursor: 'pointer' }}
            />
            Annual
            <span style={{
              marginLeft: '8px',
              padding: '4px 10px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '700',
            }}>
              Save 20%
            </span>
          </label>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        marginBottom: '60px',
      }}>
        <PricingCard
          tier="free"
          billingCycle={billingCycle}
          isPopular={false}
          onSelectPlan={handleSelectPlan}
        />
        <PricingCard
          tier="premium"
          billingCycle={billingCycle}
          isPopular={true}
          onSelectPlan={handleSelectPlan}
        />
        <PricingCard
          tier="pro"
          billingCycle={billingCycle}
          isPopular={false}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
      }}>
        <h2 style={{
          fontSize: 'var(--fs-h2)',
          fontWeight: '700',
          marginBottom: '32px',
          color: styling.colors.dark,
          textAlign: 'center',
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            {
              q: 'Can I upgrade or downgrade my plan?',
              a: 'Yes, you can change your subscription plan anytime. Changes take effect at the next billing cycle.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes! Start with our Free plan to explore all features. Upgrade to Premium or Pro anytime.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major payment methods through Razorpay including credit/debit cards, UPI, net banking, and digital wallets.',
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes, you can cancel anytime. Your premium access continues until the end of your billing cycle.',
            },
            {
              q: 'Are there refunds?',
              a: 'We offer a 7-day money-back guarantee if you\'re not satisfied with your Premium or Pro subscription.',
            },
          ].map((faq, idx) => (
            <div key={idx}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: '700',
                color: styling.colors.dark,
                marginBottom: '8px',
              }}>
                {faq.q}
              </h4>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.6',
              }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Money Back Guarantee Banner */}
      <div style={{
        marginTop: '60px',
        padding: '32px',
        backgroundColor: '#fef3c7',
        borderLeft: `4px solid ${styling.colors.accent}`,
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#92400e',
          marginBottom: '8px',
        }}>
          ✓ 7-Day Money Back Guarantee
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#b45309',
          margin: 0,
        }}>
          Not satisfied? Get a full refund within 7 days of purchase. No questions asked.
        </p>
      </div>
    </div>
  );
}

export default PricingPage;
