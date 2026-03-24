import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Hook for managing user subscription and tier access
 */
export function useSubscription() {
  const [tier, setTier] = useState('free');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user subscription from database
  const loadSubscription = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && new Date(data.valid_until) > new Date()) {
        setSubscription(data);
        setTier(data.tier);
      } else {
        setSubscription(null);
        setTier('free');
      }
    } catch (e) {
      console.error('Error loading subscription:', e);
      setTier('free');
    }
    setLoading(false);
  }, []);

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((feature) => {
    const FEATURE_ACCESS = {
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
    };
    
    return FEATURE_ACCESS[feature]?.includes(tier) || false;
  }, [tier]);

  // Check if subscription is active
  const isActive = useCallback(() => {
    return subscription && new Date(subscription.valid_until) > new Date();
  }, [subscription]);

  // Get days remaining in subscription
  const getDaysRemaining = useCallback(() => {
    if (!subscription) return 0;
    const validUntil = new Date(subscription.valid_until);
    const today = new Date();
    const daysLeft = Math.ceil((validUntil - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  }, [subscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (userId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      
      setSubscription(null);
      setTier('free');
      return { success: true };
    } catch (e) {
      console.error('Error cancelling subscription:', e);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tier,
    subscription,
    loading,
    isActive,
    hasFeatureAccess,
    getDaysRemaining,
    loadSubscription,
    cancelSubscription,
  };
}
