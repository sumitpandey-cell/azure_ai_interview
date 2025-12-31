-- Migration: Create Personalized Roadmap Tables
-- Description: Tables for AI-generated learning roadmaps with payment tracking

-- Create learning_roadmaps table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Roadmap metadata
  version INT DEFAULT 1,
  overall_level TEXT CHECK (overall_level IN ('Beginner', 'Intermediate', 'Advanced')),
  
  -- Full roadmap structure (JSON)
  roadmap_data JSONB NOT NULL,
  
  -- Payment tracking
  is_paid BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10, 2) DEFAULT 0,
  payment_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('free', 'pending', 'completed', 'failed')) DEFAULT 'free',
  
  -- Lifecycle management
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roadmap_progress table
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Progress details
  phase_number INT,
  milestone_id TEXT,
  item_type TEXT CHECK (item_type IN ('phase', 'milestone', 'goal', 'interview', 'resource')),
  
  -- Completion tracking
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roadmap_purchases table (for future payment integration)
CREATE TABLE IF NOT EXISTS roadmap_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES learning_roadmaps(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_gateway TEXT DEFAULT 'razorpay',
  payment_id TEXT NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_user_active ON learning_roadmaps(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_payment ON learning_roadmaps(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_expires ON learning_roadmaps(expires_at);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_roadmap ON roadmap_progress(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user ON roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_progress_user_roadmap ON roadmap_progress(user_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_purchases_user ON roadmap_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_purchases_payment ON roadmap_purchases(payment_id);

-- Add updated_at trigger for learning_roadmaps
CREATE OR REPLACE FUNCTION update_learning_roadmaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_roadmaps_updated_at
    BEFORE UPDATE ON learning_roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_roadmaps_updated_at();

-- Add updated_at trigger for roadmap_purchases
CREATE OR REPLACE FUNCTION update_roadmap_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roadmap_purchases_updated_at
    BEFORE UPDATE ON roadmap_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_roadmap_purchases_updated_at();

-- Enable Row Level Security
ALTER TABLE learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_roadmaps
CREATE POLICY "Users can view their own roadmaps"
  ON learning_roadmaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmaps"
  ON learning_roadmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps"
  ON learning_roadmaps FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for roadmap_progress
CREATE POLICY "Users can view their own progress"
  ON roadmap_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON roadmap_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON roadmap_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for roadmap_purchases
CREATE POLICY "Users can view their own purchases"
  ON roadmap_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON roadmap_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE learning_roadmaps IS 'Stores AI-generated personalized learning roadmaps for users';
COMMENT ON TABLE roadmap_progress IS 'Tracks user progress on roadmap items (goals, milestones, phases)';
COMMENT ON TABLE roadmap_purchases IS 'Records payment transactions for roadmap purchases';
COMMENT ON COLUMN learning_roadmaps.roadmap_data IS 'JSONB structure containing phases, goals, milestones, and analysis';
COMMENT ON COLUMN learning_roadmaps.payment_status IS 'free = first roadmap, completed = paid roadmap';
COMMENT ON COLUMN roadmap_progress.item_type IS 'Type of item completed: phase, milestone, goal, interview, or resource';
