# Zombie Session Cleanup Cron Job

This document explains the zombie session cleanup system that prevents sessions from getting stuck in `in_progress` status.

## Problem

Sessions can get stuck in `in_progress` status when:
- User closes browser tab
- Browser crashes
- Device loses power
- Network disconnects
- `beforeunload` events fail (especially on mobile)

These "zombie sessions" never complete, leading to:
- Inaccurate analytics
- Cluttered database
- Potential revenue loss if duration isn't tracked

## Solution

A server-side cron job that runs every 5 minutes to auto-complete stale sessions.

## How It Works

1. **Detection**: Finds sessions in `in_progress` status with no updates for >10 minutes
2. **Usage Tracking**: Calculates and tracks usage BEFORE marking as completed (prevents revenue leak)
3. **Completion**: Marks session as completed with cleanup metadata
4. **Capping**: Limits duration to 2 hours maximum to prevent abuse

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Supabase Service Role Key (for admin access, bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Cron Job Security (generate a random secret)
CRON_SECRET="your-random-secret-here"
```

**Generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Vercel Deployment

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-zombie-sessions",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Schedule**: Every 5 minutes (`*/5 * * * *`)

### 3. Vercel Environment Variables

In your Vercel project settings, add:
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

## Manual Testing

You can manually trigger the cron job:

```bash
curl -X POST https://your-domain.com/api/cron/cleanup-zombie-sessions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Response Format

```json
{
  "success": true,
  "message": "Processed 5 zombie sessions",
  "processed": 5,
  "completed": 5,
  "errors": [],
  "timestamp": "2026-01-24T17:21:10.000Z"
}
```

## Configuration

### Adjustable Parameters

In `/src/app/api/cron/cleanup-zombie-sessions/route.ts`:

```typescript
// How long before a session is considered "zombie"
const STALE_SESSION_THRESHOLD_MINUTES = 10;

// Maximum sessions to process per run (prevents timeout)
const MAX_SESSIONS_PER_RUN = 50;

// Maximum duration cap (2 hours)
const cappedDuration = Math.min(totalDurationSeconds, 7200);
```

## Security

- **Authentication**: Protected by `CRON_SECRET` in Authorization header
- **Admin Access**: Uses Supabase service role key to bypass RLS
- **Rate Limiting**: Processes max 50 sessions per run

## Monitoring

Check Vercel logs for cron job execution:

```
✅ Zombie cleanup complete: 5/5 sessions completed
```

Look for:
- `🧟 Found X zombie sessions` - Detection
- `✅ Usage tracked for session` - Revenue tracking
- `✅ Completed zombie session` - Successful cleanup
- `❌ Failed to...` - Errors (investigate immediately)

## Fallback Behavior

If `increment_usage` RPC fails, the cron job:
1. Attempts manual subscription update
2. Still completes the session
3. Logs the error for investigation

## Alternative Scheduling (Non-Vercel)

If not using Vercel, you can use:

### GitHub Actions
```yaml
name: Cleanup Zombie Sessions
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/cleanup-zombie-sessions \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### External Cron Services
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Uptime Robot](https://uptimerobot.com) (with HTTP monitor)

## Best Practices

1. **Monitor regularly**: Check logs weekly for zombie session patterns
2. **Adjust threshold**: If users frequently have 10+ minute sessions, increase threshold
3. **Alert on errors**: Set up alerts if cleanup fails repeatedly
4. **Review feedback**: Check sessions with `zombie_session_cleanup` reason

## Troubleshooting

### No sessions being cleaned up
- Check if sessions are actually stuck (query database)
- Verify `updated_at` timestamps are being set correctly
- Ensure periodic sync is working in live interview page

### Usage not being tracked
- Check Supabase logs for `increment_usage` errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check subscription table for manual updates

### Cron job not running
- Verify `CRON_SECRET` matches in Vercel and code
- Check Vercel cron logs
- Ensure `vercel.json` is in project root
- Redeploy after adding cron configuration
