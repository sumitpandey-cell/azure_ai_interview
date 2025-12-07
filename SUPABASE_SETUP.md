# Setting Up New Supabase Backend for Next.js Project

This guide will help you set up a completely new Supabase backend for your Next.js interview platform.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your Next.js project (already set up in `interviewer-nextjs` folder)

## 🚀 Step-by-Step Setup

### 1. Create New Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `interviewer-nextjs` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### 2. Get Your API Credentials

1. Once your project is ready, go to **Settings** → **API**
2. You'll find two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long JWT token)

### 3. Configure Environment Variables

1. Open `interviewer-nextjs/.env.local`
2. Add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key-here
```

### 4. Set Up Database Schema

You need to create the database tables. Here are the main tables required:

#### A. Profiles Table

```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  gender text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  streak_count integer default 0,
  last_activity_date date
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### B. Interview Sessions Table

```sql
-- Create interview_sessions table
create table public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  template_id text not null,
  template_name text not null,
  status text not null default 'pending',
  score integer,
  feedback jsonb,
  duration integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS
alter table public.interview_sessions enable row level security;

-- Policies
create policy "Users can view their own sessions"
  on public.interview_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own sessions"
  on public.interview_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.interview_sessions for update
  using (auth.uid() = user_id);
```

#### C. User Badges Table

```sql
-- Create user_badges table
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- Enable RLS
alter table public.user_badges enable row level security;

-- Policies
create policy "Users can view their own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "Users can insert their own badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);
```

#### D. Leaderboard View

```sql
-- Create a view for leaderboard
create or replace view public.leaderboard as
select 
  p.id,
  p.full_name,
  p.avatar_url,
  p.gender,
  p.streak_count,
  count(distinct s.id) as total_interviews,
  coalesce(avg(s.score), 0) as average_score,
  max(s.completed_at) as last_interview_date
from public.profiles p
left join public.interview_sessions s on p.id = s.user_id and s.status = 'completed'
group by p.id, p.full_name, p.avatar_url, p.gender, p.streak_count
order by average_score desc, total_interviews desc;

-- Grant access
grant select on public.leaderboard to authenticated;
```

### 5. Enable Authentication Providers

#### Email/Password Authentication
1. Go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure email templates if needed

#### Google OAuth (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - Get them from https://console.cloud.google.com
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

### 6. Storage Buckets (for avatars)

```sql
-- Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Set up storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 7. Run the SQL Scripts

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste each SQL block above
4. Run them one by one
5. Check for any errors

### 8. Test the Connection

1. Start your Next.js dev server:
   ```bash
   cd interviewer-nextjs
   npm run dev
   ```

2. Open http://localhost:3000
3. Try to sign up with a new account
4. Check if the profile is created in Supabase

## 🔧 Additional Configuration

### Update Supabase Types (Optional)

If you want TypeScript types for your database:

```bash
npx supabase gen types typescript --project-id your-project-ref > src/integrations/supabase/types.ts
```

### Enable Realtime (Optional)

For real-time features:

1. Go to **Database** → **Replication**
2. Enable replication for tables you want to be realtime
3. Update your code to use `.on('postgres_changes', ...)`

## 📊 Database Schema Overview

```
┌─────────────────┐
│  auth.users     │  (Managed by Supabase Auth)
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
┌────────▼────────┐              ┌────────▼────────────┐
│   profiles      │              │ interview_sessions  │
├─────────────────┤              ├─────────────────────┤
│ id (PK)         │              │ id (PK)             │
│ email           │              │ user_id (FK)        │
│ full_name       │              │ template_id         │
│ avatar_url      │              │ status              │
│ gender          │              │ score               │
│ streak_count    │              │ feedback            │
│ last_activity   │              │ created_at          │
└────────┬────────┘              └─────────────────────┘
         │
┌────────▼────────┐
│  user_badges    │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ badge_id        │
│ earned_at       │
└─────────────────┘
```

## 🎯 Next Steps

1. ✅ Create Supabase project
2. ✅ Get API credentials
3. ✅ Update .env.local
4. ✅ Run SQL scripts to create tables
5. ✅ Enable authentication providers
6. ✅ Set up storage buckets
7. ✅ Test the application

## 🆘 Troubleshooting

### "Supabase credentials not found" warning
- Check that your `.env.local` has the correct variable names
- Restart the dev server after updating `.env.local`

### Authentication not working
- Verify Row Level Security policies are set up correctly
- Check that the `handle_new_user()` trigger is created
- Look at Supabase logs in the dashboard

### Database errors
- Check SQL Editor for syntax errors
- Verify all foreign key relationships
- Ensure RLS policies don't block your operations

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Need Help?** Check the Supabase Discord or documentation for support.
