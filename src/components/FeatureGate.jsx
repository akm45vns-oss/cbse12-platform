import React from 'react';
import { styling } from '../styles/shared';

/**
 * Component for gating premium features
 * Shows upgrade prompt if user doesn't have access
 */
export function FeatureGate({ 
  feature, 
  userTier, 
  children, 
  fallback = null,
  onUpgradeClick = null 
}) {
  // Feature access matrix
  const FEATURE_REQUIREMENTS = {
    notes_generation: ['premium', 'pro'],
    full_quiz: ['premium', 'pro'],
    sample_papers: ['premium', 'pro'],
    analytics_advanced: ['premium', 'pro'],
    weak_topics: ['premium', 'pro'],
    mentorship: ['pro'],
    live_sessions: ['pro'],
    offline_access: ['pro'],
    priority_support: ['pro'],
    custom_tests: ['pro'],
  };

  const requiredTiers = FEATURE_REQUIREMENTS[feature] || [];
  const hasAccess = requiredTiers.includes(userTier);

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  // Default upgrade prompt
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fef3c7',
      border: `1px solid #fcd34d`,
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      <h4 style={{
        fontSize: '16px',
        fontWeight: '700',
        color: '#92400e',
        marginBottom: '8px',
      }}>
        Premium Feature
      </h4>
      <p style={{
        fontSize: '14px',
        color: '#b45309',
        marginBottom: '16px',
      }}>
        Upgrade to Premium or Pro to unlock this feature
      </p>
      <button
        onClick={onUpgradeClick}
        style={{
          padding: '10px 20px',
          backgroundColor: styling.colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = styling.colors.secondary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = styling.colors.primary;
        }}
      >
        Upgrade Now
      </button>
    </div>
  );
}

/**
 * Wrapper component for premium content
 * Accepts any content and checks tier access
 */
export function PremiumContent({ 
  tier = 'free', 
  requiredTier = 'premium',
  children,
  onUpgradeClick = null 
}) {
  const TIER_HIERARCHY = ['free', 'premium', 'pro'];
  const currentTierIndex = TIER_HIERARCHY.indexOf(tier);
  const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
  
  const hasAccess = currentTierIndex >= requiredTierIndex;

  if (hasAccess) {
    return children;
  }

  return (
    <div style={{
      padding: '32px 24px',
      backgroundColor: '#f0fdf4',
      border: `2px dashed ${styling.colors.primary}`,
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '16px', fontSize: '32px' }}>🔒</div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: styling.colors.dark,
        marginBottom: '8px',
      }}>
        {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Feature
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '20px',
      }}>
        Unlock this feature by upgrading to {requiredTier} plan
      </p>
      <button
        onClick={onUpgradeClick}
        style={{
          padding: '12px 28px',
          backgroundColor: styling.colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 20px rgba(8, 145, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Upgrade to {requiredTier.toUpperCase()}
      </button>
    </div>
  );
}

/**
 * Limited trial component
 * Shows reduced functionality with upgrade prompt
 */
export function TrialLimited({ 
  tier = 'free',
  limit = 5,
  used = 0,
  feature = 'notes',
  onUpgradeClick = null 
}) {
  const remaining = Math.max(0, limit - used);
  const percentageUsed = (used / limit) * 100;

  return (
    <div style={{
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#fef3c7',
      borderRadius: '8px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#92400e',
        }}>
          Free {feature} remaining: {remaining}/{limit}
        </span>
        <button
          onClick={onUpgradeClick}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: styling.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Upgrade
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#fcdab7',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentageUsed}%`,
          height: '100%',
          backgroundColor: '#f97316',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

export default FeatureGate;
