-- =====================================================
-- AI Chat Sessions Tables
-- =====================================================
-- Stores chat sessions and messages for AI assistants
-- Sessions expire after 5 minutes of inactivity
-- Sessions are also expired on login/logout events
-- =====================================================

-- Table: ai_chat_sessions
-- Stores metadata for each chat session
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_type TEXT NOT NULL CHECK (assistant_type IN ('lia', 'mandu', 'bora', 'licperez', 'welcome')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_messages INTEGER NOT NULL DEFAULT 0,
  session_status TEXT NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: ai_chat_messages
-- Stores individual messages within a session
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_status ON ai_chat_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_last_activity ON ai_chat_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_chat_sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON ai_chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat sessions" ON ai_chat_sessions;
CREATE POLICY "Users can insert own chat sessions" ON ai_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON ai_chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON ai_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for ai_chat_messages
DROP POLICY IF EXISTS "Users can view own chat messages" ON ai_chat_messages;
CREATE POLICY "Users can view own chat messages" ON ai_chat_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON ai_chat_messages;
CREATE POLICY "Users can insert own chat messages" ON ai_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Functions
-- =====================================================

-- Function: Check if a session is expired (5 min inactivity)
CREATE OR REPLACE FUNCTION is_session_expired(p_last_activity TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function: Get or create an active chat session
CREATE OR REPLACE FUNCTION get_or_create_chat_session(
  p_user_id UUID,
  p_assistant_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_last_activity TIMESTAMPTZ;
BEGIN
  -- First, expire any sessions that have been inactive for 5+ minutes
  UPDATE ai_chat_sessions
  SET session_status = 'expired',
      end_time = NOW()
  WHERE user_id = p_user_id
    AND session_status = 'active'
    AND last_activity < NOW() - INTERVAL '5 minutes';

  -- Try to find an active session for this user and assistant type
  SELECT id, last_activity INTO v_session_id, v_last_activity
  FROM ai_chat_sessions
  WHERE user_id = p_user_id
    AND assistant_type = p_assistant_type
    AND session_status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If found and not expired, update last_activity and return it
  IF v_session_id IS NOT NULL THEN
    UPDATE ai_chat_sessions
    SET last_activity = NOW()
    WHERE id = v_session_id;
    
    RETURN v_session_id;
  END IF;

  -- No active session found, create a new one
  INSERT INTO ai_chat_sessions (user_id, assistant_type)
  VALUES (p_user_id, p_assistant_type)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add a message to a session
CREATE OR REPLACE FUNCTION add_chat_message(
  p_session_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_content TEXT
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert the message
  INSERT INTO ai_chat_messages (session_id, user_id, role, content)
  VALUES (p_session_id, p_user_id, p_role, p_content)
  RETURNING id INTO v_message_id;

  -- Update session's last_activity and message count
  UPDATE ai_chat_sessions
  SET last_activity = NOW(),
      total_messages = total_messages + 1
  WHERE id = p_session_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire all active sessions for a user (call on login/logout)
CREATE OR REPLACE FUNCTION expire_user_chat_sessions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE ai_chat_sessions
  SET session_status = 'expired',
      end_time = NOW()
  WHERE user_id = p_user_id
    AND session_status = 'active';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get chat history for a session
CREATE OR REPLACE FUNCTION get_chat_history(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.role, m.content, m.created_at
  FROM ai_chat_messages m
  JOIN ai_chat_sessions s ON m.session_id = s.id
  WHERE m.session_id = p_session_id
    AND s.user_id = p_user_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can continue chatting (session still active)
CREATE OR REPLACE FUNCTION can_user_chat(
  p_user_id UUID,
  p_assistant_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM ai_chat_sessions
    WHERE user_id = p_user_id
      AND assistant_type = p_assistant_type
      AND session_status = 'active'
      AND last_activity >= NOW() - INTERVAL '5 minutes'
  ) INTO v_session_exists;
  
  RETURN v_session_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grant execute permissions on functions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_or_create_chat_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_chat_message(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_user_chat_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_history(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_chat(UUID, TEXT) TO authenticated;
