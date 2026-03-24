/**
 * Supabase Database Schema for Subscriptions
 * 
 * Run this SQL in your Supabase SQL Editor to create the table
 */

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'pro')),
  
  -- Billing information
  order_id TEXT NOT NULL UNIQUE,
  payment_id TEXT NOT NULL UNIQUE,
  amount INT NOT NULL, -- Amount in paisa
  currency TEXT DEFAULT 'INR',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation details
  cancellation_reason TEXT,
  
  -- Metadata
  payment_method TEXT,
  customer_email TEXT,
  customer_name TEXT,
  
  -- Indexes for fast queries
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'premium', 'pro')),
  CONSTRAINT valid_cycle CHECK (billing_cycle IN ('monthly', 'annual'))
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_valid_until ON subscriptions(valid_until);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at DESC);
CREATE INDEX idx_active_subscriptions ON subscriptions(user_id) 
  WHERE cancelled_at IS NULL AND valid_until > NOW();

-- Create view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  id,
  user_id,
  tier,
  order_id,
  payment_id,
  amount,
  billing_cycle,
  created_at,
  valid_until,
  customer_email,
  customer_name
FROM subscriptions
WHERE cancelled_at IS NULL 
  AND valid_until > NOW()
ORDER BY valid_until DESC;

-- Function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_tier(user_id UUID)
RETURNS TEXT AS $$
  SELECT tier FROM subscriptions
  WHERE subscriptions.user_id = $1
    AND cancelled_at IS NULL
    AND valid_until > NOW()
  ORDER BY valid_until DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Default result is 'free' if no active subscription
CREATE OR REPLACE FUNCTION get_user_tier_with_default(user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT tier FROM subscriptions
     WHERE subscriptions.user_id = $1
       AND cancelled_at IS NULL
       AND valid_until > NOW()
     ORDER BY valid_until DESC
     LIMIT 1),
    'free'
  );
$$ LANGUAGE SQL STABLE;

-- Audit table for tracking changes
CREATE TABLE IF NOT EXISTS subscription_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'renewed', 'cancelled', 'upgraded'
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_audit_subscription_id ON subscription_audit(subscription_id);
CREATE INDEX idx_subscription_audit_action ON subscription_audit(action);
