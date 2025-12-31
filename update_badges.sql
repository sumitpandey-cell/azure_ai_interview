-- 1. Ensure the table has the correct columns
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity text;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS category text;

-- 2. Insert/Update all defined badges (Safe to run multiple times)
INSERT INTO public.badges (slug, name, description, icon_name, rarity, category)
VALUES 
  ('streak-3', '3-Day Rookie', 'Complete interviews for 3 consecutive days', '🔥', 'bronze', 'streak'),
  ('streak-7', '7-Day Consistent', 'Maintain a 7-day interview streak', '⚡', 'silver', 'streak'),
  ('streak-14', '14-Day Dedicated', 'Two weeks of consistent practice', '🌟', 'silver', 'streak'),
  ('streak-30', '30-Day Grinder', 'Show true commitment with a 30-day streak', '��', 'gold', 'streak'),
  ('streak-100', '100-Day Acharya', 'Legendary dedication - 100 days of continuous practice', '👑', 'platinum', 'streak'),
  ('high-scorer', 'High Scorer', 'Achieve a score of 80% or higher', '⭐', 'bronze', 'performance'),
  ('excellence', 'Excellence', 'Score 90% or higher in an interview', '🌟', 'silver', 'performance'),
  ('perfect-score', 'Perfect Score', 'Achieve a flawless 100% score', '💯', 'gold', 'performance'),
  ('consistent-performer', 'Consistent Performer', 'Maintain 75%+ average across 5 interviews', '📊', 'gold', 'performance'),
  ('first-interview', 'First Interview', 'Complete your first interview', '��', 'bronze', 'milestone'),
  ('interviews-5', '5 Interviews', 'Complete 5 interviews', '🎪', 'bronze', 'milestone'),
  ('interviews-10', '10 Interviews', 'Complete 10 interviews', '🎖️', 'silver', 'milestone'),
  ('interviews-25', '25 Interviews', 'Complete 25 interviews', '🏵️', 'silver', 'milestone'),
  ('interviews-50', '50 Interviews', 'Complete 50 interviews', '🏅', 'gold', 'milestone'),
  ('interviews-100', '100 Interviews', 'Complete 100 interviews - True dedication!', '🎊', 'platinum', 'milestone'),
  ('communication-guru', 'Communication Guru', 'Excel in communication skills', '💬', 'gold', 'communication'),
  ('articulate', 'Articulate', 'Demonstrate clear and concise communication', '🗣️', 'silver', 'communication'),
  ('subject-matter-expert', 'Subject Matter Expert', 'Master a specific skill domain', '🎓', 'gold', 'skill'),
  ('technical-wizard', 'Technical Wizard', 'Demonstrate exceptional technical knowledge', '🧙', 'platinum', 'skill'),
  ('weekly-top-10', 'Top 10% Weekly', 'Rank in the top 10% this week', '🏆', 'silver', 'leaderboard'),
  ('weekly-top-3', 'Weekly Top 3', 'Finish in the top 3 this week', '🥇', 'gold', 'leaderboard'),
  ('monthly-champion', 'Monthly Champion', 'Claim the #1 spot for the month', '👑', 'platinum', 'leaderboard'),
  ('quick-thinker', 'Quick Thinker', 'Complete interview in under 15 minutes', '⚡', 'bronze', 'speed'),
  ('lightning-fast', 'Lightning Fast', 'Complete interview in under 10 minutes', '⚡', 'silver', 'speed'),
  ('versatile', 'Versatile', 'Complete 3 different interview types', '🎭', 'silver', 'diversity'),
  ('jack-of-all-trades', 'Jack of All Trades', 'Complete 5 different interview types', '🌈', 'gold', 'diversity'),
  ('comeback-hero', 'Comeback Hero', 'Return after a break and complete a 3-day streak', '🦸', 'special', 'special'),
  ('early-bird', 'Early Bird', 'Complete interviews in the morning (6 AM - 10 AM)', '🌅', 'special', 'special'),
  ('night-owl', 'Night Owl', 'Complete interviews late at night (10 PM - 2 AM)', '🦉', 'special', 'special')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  rarity = EXCLUDED.rarity,
  category = EXCLUDED.category;
