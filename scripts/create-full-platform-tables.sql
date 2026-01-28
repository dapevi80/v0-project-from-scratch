-- =====================================================
-- MECORRIERON.MX - Full Platform Migration
-- Roles: Worker, Lawyer, Admin, SuperAdmin, Agent
-- Features: Marketplace, Oficina Virtual, Achievements, Payouts
-- =====================================================

-- =====================================================
-- A) LAWYER PROFILES & VERIFICATION
-- =====================================================

-- Lawyer profiles (oficina virtual)
CREATE TABLE IF NOT EXISTS lawyer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  firm_name text,
  phone text,
  bio text,
  photo_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'verified', 'rejected')),
  is_active boolean DEFAULT false,
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lawyer documents for verification
CREATE TABLE IF NOT EXISTS lawyer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('cedula_profesional', 'id_oficial', 'comprobante_domicilio', 'constancia_sat', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'under_review', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Lawyer service areas (coverage by zone)
CREATE TABLE IF NOT EXISTS lawyer_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL,
  city text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lawyer_id, state, city)
);

-- Lawyer billing (subscription + balance)
CREATE TABLE IF NOT EXISTS lawyer_billing (
  lawyer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled')),
  subscription_price_mxn integer DEFAULT 500,
  balance_mxn integer DEFAULT 0,
  lead_price_mxn integer DEFAULT 50,
  auto_charge_enabled boolean DEFAULT false,
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Lawyer ledger (transaction history)
CREATE TABLE IF NOT EXISTS lawyer_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('topup', 'subscription', 'lead_charge', 'refund', 'adjustment')),
  amount_mxn integer NOT NULL,
  balance_after integer NOT NULL,
  reference_id text,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- B) CASE MARKETPLACE & OFFERS
-- =====================================================

-- Add columns to casos if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'prequalified_by') THEN
    ALTER TABLE casos ADD COLUMN prequalified_by uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'prequalified_at') THEN
    ALTER TABLE casos ADD COLUMN prequalified_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'offered_at') THEN
    ALTER TABLE casos ADD COLUMN offered_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'assigned_at') THEN
    ALTER TABLE casos ADD COLUMN assigned_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'intake_submitted') THEN
    ALTER TABLE casos ADD COLUMN intake_submitted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'intake_submitted_at') THEN
    ALTER TABLE casos ADD COLUMN intake_submitted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casos' AND column_name = 'manual_assignment_reason') THEN
    ALTER TABLE casos ADD COLUMN manual_assignment_reason text;
  END IF;
END $$;

-- Update casos status enum if needed
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_status_check;
ALTER TABLE casos ADD CONSTRAINT casos_status_check CHECK (status IN (
  'draft', 'open', 'prequalified', 'offered', 'assigned', 
  'intake_submitted', 'in_progress', 'conciliation', 'lawsuit', 
  'closed', 'paid', 'cancelled'
));

-- Case offers (marketplace)
CREATE TABLE IF NOT EXISTS case_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  state text NOT NULL,
  city text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'taken', 'expired', 'cancelled')),
  opened_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  taken_by uuid REFERENCES auth.users(id),
  taken_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Case offer decisions (take/reject history)
CREATE TABLE IF NOT EXISTS case_offer_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES case_offers(id) ON DELETE CASCADE,
  lawyer_id uuid NOT NULL REFERENCES auth.users(id),
  decision text NOT NULL CHECK (decision IN ('take', 'reject')),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- C) CASE FILES & SIGNATURES
-- =====================================================

-- Case files (boveda compartida)
CREATE TABLE IF NOT EXISTS case_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploader_role text NOT NULL CHECK (uploader_role IN ('worker', 'lawyer', 'admin', 'superadmin', 'agent')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  file_size_bytes bigint,
  file_type text DEFAULT 'other' CHECK (file_type IN ('evidence', 'legal_doc', 'contract', 'id_doc', 'payroll', 'other')),
  description text,
  is_visible_to_worker boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Signature requests
CREATE TABLE IF NOT EXISTS signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  file_id uuid REFERENCES case_files(id),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_by_role text NOT NULL CHECK (requested_by_role IN ('lawyer', 'admin', 'superadmin')),
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'expired')),
  expires_at timestamptz,
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id),
  signature_data jsonb,
  declined_reason text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- D) AI FILE SUMMARIES
-- =====================================================

CREATE TABLE IF NOT EXISTS file_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  summary_simple text,
  key_points jsonb DEFAULT '[]'::jsonb,
  actions_required jsonb DEFAULT '[]'::jsonb,
  ai_provider text,
  ai_model text,
  tokens_used integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- E) WALLETS & ACHIEVEMENTS & PAYOUTS
-- =====================================================

-- User wallets (no custody - just address registry)
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  network text DEFAULT 'polygon' CHECK (network IN ('polygon', 'tron', 'ethereum', 'bsc')),
  address text NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Achievements (created by admin)
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  reward_mxn integer NOT NULL,
  reward_asset text DEFAULT 'USDT',
  max_claims integer,
  current_claims integer DEFAULT 0,
  requirements jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User achievements (progress tracking)
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  status text DEFAULT 'locked' CHECK (status IN ('locked', 'eligible', 'requested', 'approved', 'paid', 'rejected')),
  progress_data jsonb DEFAULT '{}'::jsonb,
  evidence jsonb,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  paid_at timestamptz,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Payouts (crypto payments)
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  achievement_id uuid REFERENCES achievements(id),
  user_achievement_id uuid REFERENCES user_achievements(id),
  asset text DEFAULT 'USDT',
  amount_mxn integer NOT NULL,
  amount_usdt numeric,
  exchange_rate numeric,
  wallet_address text NOT NULL,
  wallet_network text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'sent', 'failed', 'cancelled')),
  tx_hash text,
  failure_reason text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  sent_by uuid REFERENCES auth.users(id),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- F) CASE HISTORY / AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS case_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid REFERENCES auth.users(id),
  performed_by_role text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- G) INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_status ON lawyer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_is_active ON lawyer_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_lawyer_documents_lawyer_id ON lawyer_documents(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_documents_status ON lawyer_documents(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_service_areas_lawyer_id ON lawyer_service_areas(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_service_areas_state_city ON lawyer_service_areas(state, city);
CREATE INDEX IF NOT EXISTS idx_lawyer_ledger_lawyer_id ON lawyer_ledger(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_case_offers_status ON case_offers(status);
CREATE INDEX IF NOT EXISTS idx_case_offers_state_city ON case_offers(state, city);
CREATE INDEX IF NOT EXISTS idx_case_offer_decisions_offer_id ON case_offer_decisions(offer_id);
CREATE INDEX IF NOT EXISTS idx_case_files_case_id ON case_files(case_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_case_id ON signature_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_file_summaries_file_id ON file_summaries(file_id);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_status ON user_achievements(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON case_history(case_id);

-- =====================================================
-- H) RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_offer_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_history ENABLE ROW LEVEL SECURITY;

-- Lawyer profiles policies
DROP POLICY IF EXISTS "Lawyers can view own profile" ON lawyer_profiles;
CREATE POLICY "Lawyers can view own profile" ON lawyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lawyers can update own profile" ON lawyer_profiles;
CREATE POLICY "Lawyers can update own profile" ON lawyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lawyers can insert own profile" ON lawyer_profiles;
CREATE POLICY "Lawyers can insert own profile" ON lawyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all lawyer profiles" ON lawyer_profiles;
CREATE POLICY "Admins can view all lawyer profiles" ON lawyer_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'agent'))
  );

DROP POLICY IF EXISTS "Admins can update all lawyer profiles" ON lawyer_profiles;
CREATE POLICY "Admins can update all lawyer profiles" ON lawyer_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Lawyer billing policies
DROP POLICY IF EXISTS "Lawyers can view own billing" ON lawyer_billing;
CREATE POLICY "Lawyers can view own billing" ON lawyer_billing
  FOR SELECT USING (auth.uid() = lawyer_id);

DROP POLICY IF EXISTS "Admins can manage billing" ON lawyer_billing;
CREATE POLICY "Admins can manage billing" ON lawyer_billing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Case offers policies (marketplace)
DROP POLICY IF EXISTS "Verified lawyers can view open offers in their area" ON case_offers;
CREATE POLICY "Verified lawyers can view open offers in their area" ON case_offers
  FOR SELECT USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM lawyer_profiles lp
      JOIN lawyer_service_areas lsa ON lsa.lawyer_id = lp.user_id
      WHERE lp.user_id = auth.uid()
        AND lp.status = 'verified'
        AND lp.is_active = true
        AND lsa.state = case_offers.state
        AND lsa.is_enabled = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage all offers" ON case_offers;
CREATE POLICY "Admins can manage all offers" ON case_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'agent'))
  );

-- Case files policies
DROP POLICY IF EXISTS "Workers can view files of their cases" ON case_files;
CREATE POLICY "Workers can view files of their cases" ON case_files
  FOR SELECT USING (
    is_visible_to_worker = true AND
    EXISTS (SELECT 1 FROM casos WHERE id = case_id AND worker_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workers can upload files to their cases" ON case_files;
CREATE POLICY "Workers can upload files to their cases" ON case_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM casos WHERE id = case_id AND worker_id = auth.uid())
  );

DROP POLICY IF EXISTS "Assigned lawyers can view all case files" ON case_files;
CREATE POLICY "Assigned lawyers can view all case files" ON case_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM casos WHERE id = case_id AND lawyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Assigned lawyers can upload files" ON case_files;
CREATE POLICY "Assigned lawyers can upload files" ON case_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM casos WHERE id = case_id AND lawyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all files" ON case_files;
CREATE POLICY "Admins can manage all files" ON case_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'agent'))
  );

-- User wallets policies
DROP POLICY IF EXISTS "Users can manage own wallet" ON user_wallets;
CREATE POLICY "Users can manage own wallet" ON user_wallets
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON user_wallets;
CREATE POLICY "Admins can view all wallets" ON user_wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Achievements policies
DROP POLICY IF EXISTS "Anyone can view active achievements" ON achievements;
CREATE POLICY "Anyone can view active achievements" ON achievements
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
CREATE POLICY "Admins can manage achievements" ON achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- User achievements policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can request achievements" ON user_achievements;
CREATE POLICY "Users can request achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert user achievements" ON user_achievements;
CREATE POLICY "System can insert user achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage user achievements" ON user_achievements;
CREATE POLICY "Admins can manage user achievements" ON user_achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Payouts policies
DROP POLICY IF EXISTS "Users can view own payouts" ON payouts;
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage payouts" ON payouts;
CREATE POLICY "Admins can manage payouts" ON payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- =====================================================
-- I) TRIGGERS
-- =====================================================

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_lawyer_profiles_updated_at ON lawyer_profiles;
CREATE TRIGGER update_lawyer_profiles_updated_at
  BEFORE UPDATE ON lawyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lawyer_billing_updated_at ON lawyer_billing;
CREATE TRIGGER update_lawyer_billing_updated_at
  BEFORE UPDATE ON lawyer_billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- J) SEED DEFAULT ACHIEVEMENT
-- =====================================================

INSERT INTO achievements (code, title, description, icon, reward_mxn, reward_asset, requirements, is_active)
VALUES (
  'REFER_FRIEND_USDT_200',
  'Refiere a un amigo',
  'Gana $200 MXN en USDT cuando tu amigo complete su verificacion',
  'gift',
  200,
  'USDT',
  '{"type": "referral", "min_referrals": 1}'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward_mxn = EXCLUDED.reward_mxn,
  is_active = EXCLUDED.is_active;
