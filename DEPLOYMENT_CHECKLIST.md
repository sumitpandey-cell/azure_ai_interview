# Quick Deployment Checklist

## Pre-Deployment

- [ ] All code committed to GitHub
- [ ] Environment variables documented
- [ ] Database migrations applied to Supabase
- [ ] LiveKit Cloud account created

## Vercel Deployment (Next.js App)

1. [ ] Import GitHub repository to Vercel
2. [ ] Configure build settings (auto-detected for Next.js)
3. [ ] Add all environment variables
4. [ ] Deploy
5. [ ] Verify deployment URL works

## Agent Deployment

### LiveKit Cloud (⭐ Recommended)

1. [ ] Install LiveKit CLI (`brew install livekit-cli` or `curl -sSL https://get.livekit.io/cli | bash`)
2. [ ] Authenticate: `lk cloud auth`
3. [ ] Create agent: `lk cloud agent create interview-agent`
4. [ ] Add environment variables (GOOGLE_AI_API_KEY, NODE_ENV)
5. [ ] Deploy: `lk cloud agent deploy interview-agent`
6. [ ] Verify: `lk cloud agent list`

### Railway/Render (Alternative)

1. [ ] Create new project on Railway/Render
2. [ ] Connect GitHub repository
3. [ ] Set root directory to `agent`
4. [ ] Add environment variables
5. [ ] Deploy
6. [ ] Copy deployment URL
7. [ ] Update Vercel with `AGENT_URL` environment variable
8. [ ] Redeploy Vercel app

## Post-Deployment

1. [ ] Add Vercel URL to Supabase redirect URLs
2. [ ] Add Vercel domain to LiveKit allowed origins
3. [ ] Test full interview flow

## Environment Variables to Set

### Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GOOGLE_AI_API_KEY`

### LiveKit Cloud Agent
- `GOOGLE_AI_API_KEY`
- `NODE_ENV=production`
- ✅ LiveKit credentials auto-injected!

### Railway/Render Agent (if not using LiveKit Cloud)
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GOOGLE_AI_API_KEY`
- `NODE_ENV=production`

## Testing

- [ ] Homepage loads
- [ ] Authentication works
- [ ] Dashboard displays data
- [ ] Can create new interview
- [ ] Agent connects in live interview
- [ ] Voice interaction works
- [ ] Interview completes and generates report

## Troubleshooting

If issues occur:
1. Check deployment logs (Vercel/Railway/Render dashboards)
2. Verify all environment variables are set
3. Check LiveKit and Supabase dashboards for errors
4. Review DEPLOYMENT.md for detailed troubleshooting

---

**Need help?** See the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
