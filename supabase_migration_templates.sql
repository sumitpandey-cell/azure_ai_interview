-- Create templates table for general interview templates
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color TEXT NOT NULL,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('Technical', 'Behavioral', 'Creative')),
    skills TEXT[] NOT NULL DEFAULT '{}',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_difficulty ON templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_is_popular ON templates(is_popular);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read active templates
CREATE POLICY "Allow authenticated users to read active templates"
    ON templates
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policy: Allow public read access to active templates (optional, for guest browsing)
CREATE POLICY "Allow public read access to active templates"
    ON templates
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Seed initial template data
INSERT INTO templates (id, title, description, icon_name, color, interview_type, skills, difficulty, is_popular, category) VALUES
('frontend-developer', 'Frontend Developer', 'Template for assessing frontend development skills, including UI design, interactivity, and integration with APIs.', 'Code2', 'text-blue-500', 'Technical', ARRAY['React', 'JavaScript', 'CSS', 'HTML', 'UI/UX'], 'Intermediate', true, 'Engineer'),
('backend-developer', 'Backend Developer', 'Template for assessing backend development skills, including API design, database management, and application architecture.', 'Database', 'text-purple-500', 'Technical', ARRAY['Node.js', 'Database', 'API Design', 'System Design'], 'Intermediate', true, 'Engineer'),
('content-creator', 'Content Creator', 'Template for evaluating content creation skills, including writing quality, creativity, audience engagement, and platform knowledge.', 'PenTool', 'text-pink-500', 'Creative', ARRAY['Writing', 'Creativity', 'Social Media', 'Analytics'], 'Beginner', false, 'Marketing'),
('devops-engineer', 'DevOps Engineer', 'Template for assessing DevOps skills, including CI/CD implementation, cloud infrastructure management, automation, and monitoring.', 'Server', 'text-orange-500', 'Technical', ARRAY['Docker', 'Kubernetes', 'CI/CD', 'Cloud', 'Monitoring'], 'Advanced', false, 'Engineer'),
('fullstack-developer', 'Full Stack Developer', 'Template for assessing full stack development skills, including frontend, backend, APIs, and deployment.', 'Layers', 'text-indigo-500', 'Technical', ARRAY['Frontend', 'Backend', 'Database', 'Deployment'], 'Advanced', true, 'Engineer'),
('ai-ml-engineer', 'AI/ML Engineer', 'Template for assessing artificial intelligence and machine learning skills, including model building, data processing, and evaluation.', 'BrainCircuit', 'text-green-500', 'Technical', ARRAY['Python', 'TensorFlow', 'Data Science', 'Statistics'], 'Advanced', true, 'Engineer'),
('blockchain-developer', 'Blockchain Developer', 'Template for assessing blockchain development skills, including smart contracts, decentralized applications, and cryptography.', 'Bitcoin', 'text-yellow-500', 'Technical', ARRAY['Solidity', 'Web3', 'Smart Contracts', 'Cryptography'], 'Advanced', false, 'Engineer'),
('java-developer', 'Java Developer', 'Template for assessing Java programming skills, including OOP, frameworks, and backend development.', 'Coffee', 'text-red-500', 'Technical', ARRAY['Java', 'Spring Boot', 'OOP', 'Microservices'], 'Intermediate', false, 'Engineer'),
('marketing-head', 'Marketing Head', 'Template for assessing marketing leadership skills, including strategy, brand management, and market analysis.', 'Megaphone', 'text-cyan-500', 'Behavioral', ARRAY['Strategy', 'Leadership', 'Analytics', 'Branding'], 'Advanced', false, 'Marketing'),
('content-writer', 'Content Writer', 'Template for assessing content writing skills, including research, creativity, and SEO.', 'Feather', 'text-teal-500', 'Creative', ARRAY['Writing', 'SEO', 'Research', 'Grammar'], 'Beginner', false, 'Marketing'),
('digital-marketing-specialist', 'Digital Marketing Specialist', 'Template for assessing digital marketing skills, including SEO, SEM, social media, and analytics.', 'BarChart', 'text-violet-500', 'Technical', ARRAY['SEO', 'SEM', 'Social Media', 'Analytics'], 'Intermediate', false, 'Marketing'),
('hr-specialist', 'HR Specialist', 'Template for assessing human resources skills, including recruitment, employee relations, and compliance.', 'Users', 'text-rose-500', 'Behavioral', ARRAY['Recruitment', 'Employee Relations', 'Compliance'], 'Intermediate', false, 'Other')
ON CONFLICT (id) DO NOTHING;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER templates_updated_at_trigger
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();

-- Grant permissions
GRANT SELECT ON templates TO authenticated;
GRANT SELECT ON templates TO anon;
