-- =====================================================
-- AI Credits System Schema
-- =====================================================
-- This script creates the credit wallet, transactions,
-- coupons, and reward grants tables for AI usage tracking
-- =====================================================

-- =====================================================
-- 1. AI Credit Wallets Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  plan_nombre TEXT NOT NULL DEFAULT 'Plan Gratuito',
  creditos_mensuales INTEGER NOT NULL DEFAULT 100,
  creditos_usados INTEGER NOT NULL DEFAULT 0,
  creditos_extra INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  renewal_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding wallets due for renewal
CREATE INDEX IF NOT EXISTS idx_ai_credit_wallets_renewal 
  ON ai_credit_wallets(renewal_at) WHERE NOT is_blocked;

-- =====================================================
-- 2. AI Credit Transactions Table (Ledger)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('debit', 'credit')),
  monto INTEGER NOT NULL CHECK (monto > 0),
  fuente TEXT NOT NULL CHECK (fuente IN ('chat', 'document', 'reward', 'coupon', 'admin', 'purchase', 'renewal')),
  descripcion TEXT,
  metadata JSONB DEFAULT '{}',
  balance_after INTEGER, -- Snapshot of balance after transaction
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_user 
  ON ai_credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_fuente 
  ON ai_credit_transactions(fuente, created_at DESC);

-- =====================================================
-- 3. AI Coupons Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  creditos INTEGER NOT NULL CHECK (creditos > 0),
  transferible BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired')),
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for coupon lookups
CREATE INDEX IF NOT EXISTS idx_ai_coupons_codigo 
  ON ai_coupons(codigo) WHERE status = 'active';

-- =====================================================
-- 4. AI Coupon Redemptions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES ai_coupons(id) ON DELETE CASCADE,
  creditos_granted INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- Index for user redemption history
CREATE INDEX IF NOT EXISTS idx_ai_coupon_redemptions_user 
  ON ai_coupon_redemptions(user_id, redeemed_at DESC);

-- =====================================================
-- 5. AI Reward Grants Table (Achievement rewards)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_reward_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL,
  achievement_name TEXT,
  creditos INTEGER NOT NULL CHECK (creditos > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Index for user grants
CREATE INDEX IF NOT EXISTS idx_ai_reward_grants_user 
  ON ai_reward_grants(user_id, created_at DESC);

-- =====================================================
-- 6. Add AI credits reward column to achievements (if exists)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'ai_credits_reward') THEN
      ALTER TABLE achievements ADD COLUMN ai_credits_reward INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 7. Helper Functions
-- =====================================================

-- Function: Get user's available credits
CREATE OR REPLACE FUNCTION get_user_available_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets;
  v_available INTEGER;
BEGIN
  -- Get or create wallet
  SELECT * INTO v_wallet FROM ai_credit_wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create default wallet
    INSERT INTO ai_credit_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Check if blocked
  IF v_wallet.is_blocked THEN
    RETURN 0;
  END IF;
  
  -- Calculate available: (monthly - used) + extra
  v_available := (v_wallet.creditos_mensuales - v_wallet.creditos_usados) + v_wallet.creditos_extra;
  
  RETURN GREATEST(v_available, 0);
END;
$$;

-- Function: Get full wallet info
CREATE OR REPLACE FUNCTION get_user_wallet(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  plan_id TEXT,
  plan_nombre TEXT,
  creditos_mensuales INTEGER,
  creditos_usados INTEGER,
  creditos_extra INTEGER,
  creditos_disponibles INTEGER,
  is_blocked BOOLEAN,
  block_reason TEXT,
  renewal_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets;
BEGIN
  -- Get or create wallet
  SELECT * INTO v_wallet FROM ai_credit_wallets w WHERE w.user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO ai_credit_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN QUERY SELECT 
    v_wallet.user_id,
    v_wallet.plan_id,
    v_wallet.plan_nombre,
    v_wallet.creditos_mensuales,
    v_wallet.creditos_usados,
    v_wallet.creditos_extra,
    GREATEST((v_wallet.creditos_mensuales - v_wallet.creditos_usados) + v_wallet.creditos_extra, 0),
    v_wallet.is_blocked,
    v_wallet.block_reason,
    v_wallet.renewal_at;
END;
$$;

-- Function: Debit credits (use credits)
CREATE OR REPLACE FUNCTION debit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_fuente TEXT,
  p_descripcion TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  balance_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets;
  v_available INTEGER;
  v_new_usados INTEGER;
  v_new_extra INTEGER;
  v_debit_from_monthly INTEGER;
  v_debit_from_extra INTEGER;
BEGIN
  -- Lock wallet row
  SELECT * INTO v_wallet FROM ai_credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO ai_credit_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Check if blocked
  IF v_wallet.is_blocked THEN
    RETURN QUERY SELECT false, 'Wallet is blocked: ' || COALESCE(v_wallet.block_reason, 'Unknown reason'), 0;
    RETURN;
  END IF;
  
  -- Calculate available
  v_available := (v_wallet.creditos_mensuales - v_wallet.creditos_usados) + v_wallet.creditos_extra;
  
  IF v_available < p_amount THEN
    RETURN QUERY SELECT false, 'Insufficient credits', v_available;
    RETURN;
  END IF;
  
  -- Debit from monthly first, then extra
  v_debit_from_monthly := LEAST(p_amount, v_wallet.creditos_mensuales - v_wallet.creditos_usados);
  v_debit_from_extra := p_amount - v_debit_from_monthly;
  
  v_new_usados := v_wallet.creditos_usados + v_debit_from_monthly;
  v_new_extra := v_wallet.creditos_extra - v_debit_from_extra;
  
  -- Update wallet
  UPDATE ai_credit_wallets
  SET 
    creditos_usados = v_new_usados,
    creditos_extra = v_new_extra,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO ai_credit_transactions (user_id, tipo, monto, fuente, descripcion, metadata, balance_after)
  VALUES (p_user_id, 'debit', p_amount, p_fuente, p_descripcion, p_metadata, v_available - p_amount);
  
  RETURN QUERY SELECT true, 'Credits debited successfully', v_available - p_amount;
END;
$$;

-- Function: Credit credits (add credits)
CREATE OR REPLACE FUNCTION credit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_fuente TEXT,
  p_descripcion TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  balance_after INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets;
  v_new_balance INTEGER;
BEGIN
  -- Get or create wallet
  SELECT * INTO v_wallet FROM ai_credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO ai_credit_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Add to extra credits
  UPDATE ai_credit_wallets
  SET 
    creditos_extra = creditos_extra + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  v_new_balance := (v_wallet.creditos_mensuales - v_wallet.creditos_usados) + v_wallet.creditos_extra + p_amount;
  
  -- Record transaction
  INSERT INTO ai_credit_transactions (user_id, tipo, monto, fuente, descripcion, metadata, balance_after)
  VALUES (p_user_id, 'credit', p_amount, p_fuente, p_descripcion, p_metadata, v_new_balance);
  
  RETURN QUERY SELECT true, 'Credits added successfully', v_new_balance;
END;
$$;

-- Function: Redeem coupon
CREATE OR REPLACE FUNCTION redeem_coupon(p_user_id UUID, p_codigo TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  creditos_granted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon ai_coupons;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon FROM ai_coupons 
  WHERE UPPER(codigo) = UPPER(p_codigo) AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Coupon not found or inactive'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    UPDATE ai_coupons SET status = 'expired' WHERE id = v_coupon.id;
    RETURN QUERY SELECT false, 'Coupon has expired'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check if user already redeemed (for non-transferible)
  IF NOT v_coupon.transferible THEN
    SELECT EXISTS(
      SELECT 1 FROM ai_coupon_redemptions 
      WHERE user_id = p_user_id AND coupon_id = v_coupon.id
    ) INTO v_already_redeemed;
    
    IF v_already_redeemed THEN
      RETURN QUERY SELECT false, 'You have already redeemed this coupon'::TEXT, 0;
      RETURN;
    END IF;
  END IF;
  
  -- Check max redemptions
  IF v_coupon.current_redemptions >= v_coupon.max_redemptions THEN
    UPDATE ai_coupons SET status = 'exhausted' WHERE id = v_coupon.id;
    RETURN QUERY SELECT false, 'Coupon has reached maximum redemptions'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Record redemption
  INSERT INTO ai_coupon_redemptions (user_id, coupon_id, creditos_granted)
  VALUES (p_user_id, v_coupon.id, v_coupon.creditos);
  
  -- Update coupon redemption count
  UPDATE ai_coupons 
  SET 
    current_redemptions = current_redemptions + 1,
    status = CASE 
      WHEN current_redemptions + 1 >= max_redemptions THEN 'exhausted'
      ELSE status
    END
  WHERE id = v_coupon.id;
  
  -- Add credits to user
  PERFORM credit_credits(p_user_id, v_coupon.creditos, 'coupon', 'Coupon redeemed: ' || p_codigo, 
    jsonb_build_object('coupon_id', v_coupon.id, 'coupon_code', p_codigo));
  
  RETURN QUERY SELECT true, 'Coupon redeemed successfully!'::TEXT, v_coupon.creditos;
END;
$$;

-- Function: Grant achievement reward (prevents duplicates)
CREATE OR REPLACE FUNCTION grant_achievement_reward(
  p_user_id UUID,
  p_achievement_id UUID,
  p_achievement_name TEXT,
  p_creditos INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  creditos_granted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_granted BOOLEAN;
BEGIN
  -- Check if already granted
  SELECT EXISTS(
    SELECT 1 FROM ai_reward_grants 
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_already_granted;
  
  IF v_already_granted THEN
    RETURN QUERY SELECT false, 'Reward already granted for this achievement'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Record grant
  INSERT INTO ai_reward_grants (user_id, achievement_id, achievement_name, creditos)
  VALUES (p_user_id, p_achievement_id, p_achievement_name, p_creditos);
  
  -- Add credits
  PERFORM credit_credits(p_user_id, p_creditos, 'reward', 'Achievement: ' || p_achievement_name,
    jsonb_build_object('achievement_id', p_achievement_id, 'achievement_name', p_achievement_name));
  
  RETURN QUERY SELECT true, 'Achievement reward granted!'::TEXT, p_creditos;
END;
$$;

-- Function: Reset monthly credits (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH renewed AS (
    UPDATE ai_credit_wallets
    SET 
      creditos_usados = 0,
      renewal_at = renewal_at + INTERVAL '1 month',
      updated_at = NOW()
    WHERE renewal_at <= NOW() AND NOT is_blocked
    RETURNING user_id
  )
  SELECT COUNT(*) INTO v_count FROM renewed;
  
  -- Log renewal transactions
  INSERT INTO ai_credit_transactions (user_id, tipo, monto, fuente, descripcion)
  SELECT user_id, 'credit', creditos_mensuales, 'renewal', 'Monthly credit renewal'
  FROM ai_credit_wallets
  WHERE renewal_at > NOW() - INTERVAL '1 minute'; -- Recently renewed
  
  RETURN v_count;
END;
$$;

-- Function: Admin block/unblock wallet
CREATE OR REPLACE FUNCTION admin_set_wallet_blocked(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_credit_wallets
  SET 
    is_blocked = p_blocked,
    block_reason = CASE WHEN p_blocked THEN p_reason ELSE NULL END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function: Admin update user plan
CREATE OR REPLACE FUNCTION admin_update_user_plan(
  p_user_id UUID,
  p_plan_id TEXT,
  p_plan_nombre TEXT,
  p_creditos_mensuales INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_credit_wallets (user_id, plan_id, plan_nombre, creditos_mensuales)
  VALUES (p_user_id, p_plan_id, p_plan_nombre, p_creditos_mensuales)
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = p_plan_id,
    plan_nombre = p_plan_nombre,
    creditos_mensuales = p_creditos_mensuales,
    updated_at = NOW();
  
  RETURN true;
END;
$$;

-- =====================================================
-- 8. RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE ai_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reward_grants ENABLE ROW LEVEL SECURITY;

-- Wallets policies
DROP POLICY IF EXISTS "Users can view own wallet" ON ai_credit_wallets;
CREATE POLICY "Users can view own wallet" ON ai_credit_wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON ai_credit_wallets;
CREATE POLICY "Admins can view all wallets" ON ai_credit_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update wallets" ON ai_credit_wallets;
CREATE POLICY "Admins can update wallets" ON ai_credit_wallets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON ai_credit_transactions;
CREATE POLICY "Users can view own transactions" ON ai_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON ai_credit_transactions;
CREATE POLICY "Admins can view all transactions" ON ai_credit_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Coupons policies
DROP POLICY IF EXISTS "Anyone can view active coupons" ON ai_coupons;
CREATE POLICY "Anyone can view active coupons" ON ai_coupons
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage coupons" ON ai_coupons;
CREATE POLICY "Admins can manage coupons" ON ai_coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Redemptions policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON ai_coupon_redemptions;
CREATE POLICY "Users can view own redemptions" ON ai_coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all redemptions" ON ai_coupon_redemptions;
CREATE POLICY "Admins can view all redemptions" ON ai_coupon_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- Reward grants policies
DROP POLICY IF EXISTS "Users can view own grants" ON ai_reward_grants;
CREATE POLICY "Users can view own grants" ON ai_reward_grants
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all grants" ON ai_reward_grants;
CREATE POLICY "Admins can view all grants" ON ai_reward_grants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 9. Sample Data for Testing
-- =====================================================

-- Sample coupons
INSERT INTO ai_coupons (codigo, creditos, transferible, max_redemptions, expires_at)
VALUES 
  ('BIENVENIDO2024', 50, false, 1000, NOW() + INTERVAL '1 year'),
  ('PROMO100', 100, false, 100, NOW() + INTERVAL '3 months'),
  ('VIP500', 500, false, 10, NOW() + INTERVAL '1 month')
ON CONFLICT (codigo) DO NOTHING;
