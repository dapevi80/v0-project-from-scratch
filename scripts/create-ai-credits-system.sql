-- =====================================================
-- AI CREDITS SYSTEM
-- Sistema de créditos para asistentes de IA
-- =====================================================

-- 1. AI Credit Wallets - Billetera de créditos por usuario
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

-- Index for renewal queries
CREATE INDEX IF NOT EXISTS idx_ai_credit_wallets_renewal ON ai_credit_wallets(renewal_at);

-- 2. AI Credit Transactions - Historial de transacciones
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('debit', 'credit')),
  monto INTEGER NOT NULL CHECK (monto > 0),
  fuente TEXT NOT NULL CHECK (fuente IN ('chat', 'document', 'reward', 'coupon', 'admin', 'purchase', 'renewal')),
  descripcion TEXT,
  metadata JSONB DEFAULT '{}',
  saldo_despues INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_user ON ai_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_created ON ai_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_tipo ON ai_credit_transactions(tipo);

-- 3. AI Coupons - Cupones de créditos
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  creditos INTEGER NOT NULL CHECK (creditos > 0),
  transferible BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired')),
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_ai_coupons_codigo ON ai_coupons(codigo);
CREATE INDEX IF NOT EXISTS idx_ai_coupons_status ON ai_coupons(status);

-- 4. AI Coupon Redemptions - Registro de canjes
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES ai_coupons(id) ON DELETE CASCADE,
  creditos_recibidos INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_coupon_redemptions_user ON ai_coupon_redemptions(user_id);

-- 5. AI Reward Grants - Recompensas por logros
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_reward_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL,
  creditos INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_reward_grants_user ON ai_reward_grants(user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get available credits for a user
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_available_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets%ROWTYPE;
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

-- Function: Debit credits (use credits)
-- =====================================================
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
  saldo_restante INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets%ROWTYPE;
  v_available INTEGER;
  v_new_balance INTEGER;
  v_debit_from_monthly INTEGER;
  v_debit_from_extra INTEGER;
BEGIN
  -- Get wallet
  SELECT * INTO v_wallet FROM ai_credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create default wallet
    INSERT INTO ai_credit_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Check if blocked
  IF v_wallet.is_blocked THEN
    RETURN QUERY SELECT false, 'Usuario bloqueado: ' || COALESCE(v_wallet.block_reason, 'Sin razón'), 0;
    RETURN;
  END IF;
  
  -- Calculate available
  v_available := (v_wallet.creditos_mensuales - v_wallet.creditos_usados) + v_wallet.creditos_extra;
  
  -- Check if enough credits
  IF v_available < p_amount THEN
    RETURN QUERY SELECT false, 'Créditos insuficientes', v_available;
    RETURN;
  END IF;
  
  -- Debit from monthly first, then extra
  v_debit_from_monthly := LEAST(p_amount, v_wallet.creditos_mensuales - v_wallet.creditos_usados);
  v_debit_from_extra := p_amount - v_debit_from_monthly;
  
  -- Update wallet
  UPDATE ai_credit_wallets
  SET 
    creditos_usados = creditos_usados + v_debit_from_monthly,
    creditos_extra = creditos_extra - v_debit_from_extra,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Calculate new balance
  v_new_balance := v_available - p_amount;
  
  -- Record transaction
  INSERT INTO ai_credit_transactions (user_id, tipo, monto, fuente, descripcion, metadata, saldo_despues)
  VALUES (p_user_id, 'debit', p_amount, p_fuente, p_descripcion, p_metadata, v_new_balance);
  
  RETURN QUERY SELECT true, 'Créditos debitados correctamente', v_new_balance;
END;
$$;

-- Function: Credit credits (add credits)
-- =====================================================
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
  saldo_nuevo INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet ai_credit_wallets%ROWTYPE;
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
  
  -- Calculate new balance
  v_new_balance := (v_wallet.creditos_mensuales - v_wallet.creditos_usados) + v_wallet.creditos_extra + p_amount;
  
  -- Record transaction
  INSERT INTO ai_credit_transactions (user_id, tipo, monto, fuente, descripcion, metadata, saldo_despues)
  VALUES (p_user_id, 'credit', p_amount, p_fuente, p_descripcion, p_metadata, v_new_balance);
  
  RETURN QUERY SELECT true, 'Créditos agregados correctamente', v_new_balance;
END;
$$;

-- Function: Redeem coupon
-- =====================================================
CREATE OR REPLACE FUNCTION redeem_coupon(p_user_id UUID, p_codigo TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  creditos_recibidos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon ai_coupons%ROWTYPE;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon FROM ai_coupons WHERE UPPER(codigo) = UPPER(p_codigo) FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no encontrado', 0;
    RETURN;
  END IF;
  
  -- Check status
  IF v_coupon.status != 'active' THEN
    RETURN QUERY SELECT false, 'Cupón no está activo', 0;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    UPDATE ai_coupons SET status = 'expired' WHERE id = v_coupon.id;
    RETURN QUERY SELECT false, 'Cupón expirado', 0;
    RETURN;
  END IF;
  
  -- Check if already redeemed by user (for non-transferable)
  IF NOT v_coupon.transferible THEN
    SELECT EXISTS(
      SELECT 1 FROM ai_coupon_redemptions 
      WHERE user_id = p_user_id AND coupon_id = v_coupon.id
    ) INTO v_already_redeemed;
    
    IF v_already_redeemed THEN
      RETURN QUERY SELECT false, 'Ya has canjeado este cupón', 0;
      RETURN;
    END IF;
  END IF;
  
  -- Check max redemptions
  IF v_coupon.current_redemptions >= v_coupon.max_redemptions THEN
    UPDATE ai_coupons SET status = 'exhausted' WHERE id = v_coupon.id;
    RETURN QUERY SELECT false, 'Cupón agotado', 0;
    RETURN;
  END IF;
  
  -- Record redemption
  INSERT INTO ai_coupon_redemptions (user_id, coupon_id, creditos_recibidos)
  VALUES (p_user_id, v_coupon.id, v_coupon.creditos);
  
  -- Update coupon
  UPDATE ai_coupons 
  SET current_redemptions = current_redemptions + 1,
      status = CASE WHEN current_redemptions + 1 >= max_redemptions THEN 'exhausted' ELSE status END
  WHERE id = v_coupon.id;
  
  -- Add credits to user
  PERFORM credit_credits(p_user_id, v_coupon.creditos, 'coupon', 'Cupón: ' || p_codigo, jsonb_build_object('coupon_id', v_coupon.id));
  
  RETURN QUERY SELECT true, 'Cupón canjeado correctamente', v_coupon.creditos;
END;
$$;

-- Function: Reset monthly credits (for cron job)
-- =====================================================
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Reset credits for wallets past renewal date
  WITH renewed AS (
    UPDATE ai_credit_wallets
    SET 
      creditos_usados = 0,
      renewal_at = NOW() + INTERVAL '1 month',
      updated_at = NOW()
    WHERE renewal_at <= NOW()
    RETURNING user_id, creditos_mensuales
  )
  SELECT COUNT(*) INTO v_count FROM renewed;
  
  -- Log renewals
  INSERT INTO ai_credit_transactions (user_id, tipo, monto, fuente, descripcion, saldo_despues)
  SELECT 
    user_id, 
    'credit', 
    creditos_mensuales, 
    'renewal', 
    'Renovación mensual de créditos',
    creditos_mensuales + creditos_extra
  FROM ai_credit_wallets
  WHERE renewal_at > NOW() - INTERVAL '1 minute';
  
  RETURN v_count;
END;
$$;

-- Function: Get wallet info
-- =====================================================
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
  v_wallet ai_credit_wallets%ROWTYPE;
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

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE ai_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reward_grants ENABLE ROW LEVEL SECURITY;

-- ai_credit_wallets policies
CREATE POLICY "Users can view own wallet" ON ai_credit_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON ai_credit_wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

CREATE POLICY "Admins can update wallets" ON ai_credit_wallets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- ai_credit_transactions policies
CREATE POLICY "Users can view own transactions" ON ai_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON ai_credit_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- ai_coupons policies
CREATE POLICY "Anyone can view active coupons" ON ai_coupons
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage coupons" ON ai_coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- ai_coupon_redemptions policies
CREATE POLICY "Users can view own redemptions" ON ai_coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions" ON ai_coupon_redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- ai_reward_grants policies
CREATE POLICY "Users can view own grants" ON ai_reward_grants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all grants" ON ai_reward_grants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
  );

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Sample coupons for testing
INSERT INTO ai_coupons (codigo, creditos, transferible, max_redemptions, expires_at)
VALUES 
  ('BIENVENIDO50', 50, false, 1000, NOW() + INTERVAL '1 year'),
  ('PROMO100', 100, false, 100, NOW() + INTERVAL '3 months'),
  ('VIP500', 500, false, 10, NOW() + INTERVAL '1 month')
ON CONFLICT (codigo) DO NOTHING;
