# LiveKit Configuration Diagnostic

## Issue: Netlify App Can't Connect to LiveKit Cloud Agent

### Current Configuration (Local)

✅ **Root `.env`:**
- `LIVEKIT_URL=wss://my-project-32r2dun3.livekit.cloud`

✅ **Agent `.env`:**
- `LIVEKIT_URL=wss://my-project-32r2dun3.livekit.cloud`

---

## Checklist: Verify Netlify Environment Variables

### Step 1: Check Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your deployed app
3. Navigate to **Site settings** → **Environment variables**
4. Verify these variables exist and have the **EXACT** values:

#### Required Variables:

| Variable | Expected Value | Status |
|----------|---------------|--------|
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://my-project-32r2dun3.livekit.cloud` | ⬜ Check |
| `LIVEKIT_API_KEY` | `API...` (your key) | ⬜ Check |
| `LIVEKIT_API_SECRET` | `...` (your secret) | ⬜ Check |

> **CRITICAL**: The client-side needs `NEXT_PUBLIC_LIVEKIT_URL` (with the `NEXT_PUBLIC_` prefix)!

---

### Step 2: Common Mistakes

❌ **Mistake 1**: Using `LIVEKIT_URL` instead of `NEXT_PUBLIC_LIVEKIT_URL`
- Next.js requires the `NEXT_PUBLIC_` prefix for client-side environment variables
- Without it, the browser can't access the LiveKit URL

❌ **Mistake 2**: URL format mismatch
- ✅ Correct: `wss://my-project-32r2dun3.livekit.cloud`
- ❌ Wrong: `https://my-project-32r2dun3.livekit.cloud` (http instead of wss)
- ❌ Wrong: `wss://my-project-32r2dun3.livekit.cloud/` (trailing slash)

❌ **Mistake 3**: Different LiveKit projects
- Netlify app points to one LiveKit project
- Agent deployed to a different LiveKit project

---

### Step 3: Verify LiveKit Cloud Agent Configuration

Check that your agent is deployed to the **same LiveKit project**:

1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io)
2. Check which project your agent is deployed to
3. Verify the project URL matches: `my-project-32r2dun3.livekit.cloud`

---

### Step 4: Check Browser Console (When Testing on Netlify)

1. Open your deployed Netlify app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Start an interview
5. Look for errors like:
   - `Failed to connect to LiveKit`
   - `WebSocket connection failed`
   - `LIVEKIT_URL is undefined`

Take a screenshot of any errors and share them.

---

### Step 5: Verify Token Generation

The token generation API (`/api/livekit_token/route.ts`) uses:
```typescript
url: process.env.LIVEKIT_URL!,
```

This means Netlify needs **both**:
- `NEXT_PUBLIC_LIVEKIT_URL` (for client-side)
- `LIVEKIT_URL` (for server-side API routes)

**Recommendation**: Set both to the same value in Netlify:
```
NEXT_PUBLIC_LIVEKIT_URL=wss://my-project-32r2dun3.livekit.cloud
LIVEKIT_URL=wss://my-project-32r2dun3.livekit.cloud
```

---

## Quick Fix Steps

### Option 1: Add Missing Environment Variable

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Add:
   - **Key**: `NEXT_PUBLIC_LIVEKIT_URL`
   - **Value**: `wss://my-project-32r2dun3.livekit.cloud`
4. Click **Save**
5. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Option 2: Verify All LiveKit Variables

Make sure these are all set in Netlify:

```env
# Client-side (browser needs this)
NEXT_PUBLIC_LIVEKIT_URL=wss://my-project-32r2dun3.livekit.cloud

# Server-side (API routes need these)
LIVEKIT_URL=wss://my-project-32r2dun3.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

---

## Testing After Fix

1. **Redeploy** your Netlify app (after adding/fixing env vars)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Test the interview flow**:
   - Start a new interview
   - Check if the agent connects
   - Verify audio works

---

## Still Not Working?

If the issue persists, check:

1. **LiveKit Cloud Agent Logs**:
   ```bash
   lk cloud agent logs interview-agent --follow
   ```

2. **Netlify Function Logs**:
   - Go to Netlify Dashboard → **Functions** → View logs
   - Look for errors in the `livekit_token` function

3. **Network Tab**:
   - Open browser DevTools → **Network** tab
   - Filter by "WS" (WebSocket)
   - Check if WebSocket connection to LiveKit is attempted

---

## Expected Behavior

✅ **When Working Correctly**:
1. Netlify app calls `/api/livekit_token` to get a token
2. Token includes the LiveKit URL: `wss://my-project-32r2dun3.livekit.cloud`
3. Browser connects to LiveKit room using this URL
4. LiveKit Cloud automatically dispatches the agent to the room
5. Agent connects and starts the interview

❌ **When Broken**:
- Browser can't find LiveKit URL (undefined)
- Browser connects to wrong LiveKit server
- Agent is on different LiveKit project
- Token generation fails due to missing credentials
