-- Table 1: signals
CREATE TABLE signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  signal_type text NOT NULL,  -- 'funding' | 'job_post' | 'regulatory' | 'news'
  signal_date date NOT NULL,
  signal_detail text NOT NULL,
  source_url text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_name, signal_type, signal_date)
);

-- Table 2: prospects
CREATE TABLE prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text UNIQUE NOT NULL,
  intent_score integer CHECK (intent_score >= 0 AND intent_score <= 100),
  urgency text CHECK (urgency IN ('high','medium','low')),
  reasoning text,
  recommended_persona text CHECK (recommended_persona IN ('CTO','CFO','CPO','CEO','Compliance')),
  signal_count integer DEFAULT 0,
  scored_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 3: stakeholders
CREATE TABLE stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  linkedin_url text,
  buyer_role text CHECK (buyer_role IN ('Champion','Economic Buyer','Technical Evaluator','Compliance Gatekeeper','Unknown')),
  outreach_priority integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Table 4: sequences
CREATE TABLE sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id uuid REFERENCES stakeholders(id) ON DELETE CASCADE,
  persona text NOT NULL,
  email_1_subject text,
  email_1_body text,
  email_2_subject text,
  email_2_body text,
  email_3_subject text,
  email_3_body text,
  compliance_status text DEFAULT 'pending' CHECK (compliance_status IN ('pending','flagged','approved','sent')),
  compliance_flags jsonb,  -- [{phrase, location, suggestion}]
  sent_at timestamptz,
  open_at timestamptz,
  reply_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- Anonymous users (frontend) can read all tables
CREATE POLICY "Enable read access for all users" ON signals FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON prospects FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON stakeholders FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON sequences FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_signals_company_date ON signals(company_name, signal_date);
CREATE INDEX idx_prospects_score ON prospects(intent_score DESC);
CREATE INDEX idx_sequences_status ON sequences(compliance_status);
