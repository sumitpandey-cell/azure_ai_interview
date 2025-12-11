# Quick Start: Deploy to LiveKit Cloud

This is the **fastest and easiest** way to deploy your AI Interview application.

## Prerequisites

- GitHub account
- Vercel account
- LiveKit Cloud account
- Supabase project
- Google AI API key

## Step 1: Deploy Next.js to Vercel (5 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Add environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_key
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   GOOGLE_AI_API_KEY=your_key
   ```
5. Click "Deploy"

## Step 2: Deploy Agent to LiveKit Cloud (5 minutes)

```bash
# Install LiveKit CLI
brew install livekit-cli  # macOS
# or
curl -sSL https://get.livekit.io/cli | bash  # Linux

# Navigate to agent directory
cd agent

# Authenticate
lk cloud auth

# Create and deploy agent
lk cloud agent create interview-agent
lk cloud agent deploy interview-agent

# Add environment variables when prompted:
# - GOOGLE_AI_API_KEY=your_key
# - NODE_ENV=production
```

## Step 3: Configure Services (2 minutes)

### Supabase
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add Vercel URL to Site URL and Redirect URLs

### LiveKit
1. Go to LiveKit Dashboard → Settings
2. Add Vercel domain to Allowed Origins

## Step 4: Test (2 minutes)

1. Visit your Vercel URL
2. Sign up/Login
3. Start an interview
4. Verify agent connects and responds

## Done! 🎉

**Total time: ~15 minutes**

### Monitoring

```bash
# Check agent status
lk cloud agent list

# View logs
lk cloud agent logs interview-agent --follow

# Monitor sessions
lk cloud agent sessions interview-agent
```

### Updating Your Agent

```bash
# Make code changes, then:
lk cloud agent deploy interview-agent

# Instant rollback if needed:
lk cloud agent rollback interview-agent
```

### Cost

- **Low traffic** (10 interviews/month): ~$3/month
- **Medium traffic** (100 interviews/month): ~$30-50/month
- All services have free tiers for development

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
