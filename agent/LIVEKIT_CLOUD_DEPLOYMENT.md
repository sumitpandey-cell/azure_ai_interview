# LiveKit Cloud Deployment Guide

This guide walks you through deploying the Azure OpenAI Realtime API agent to LiveKit Cloud.

## Prerequisites

Before deploying, ensure you have:

1. **LiveKit Cloud Account**: Sign up at [cloud.livekit.io](https://cloud.livekit.io)
2. **LiveKit CLI**: Install the LiveKit CLI tool
   ```bash
   # macOS
   brew install livekit-cli
   
   # Linux/Windows - Download from: https://github.com/livekit/livekit-cli/releases
   ```
3. **Azure OpenAI Access**: An Azure OpenAI resource with Realtime API deployment
4. **Docker**: For local testing (optional but recommended)

## Project Configuration

Your agent is already configured in `livekit.toml`:

```toml
[project]
  subdomain = "arjunaai-b6xiyilp"

[agent]
  id = "CA_ZWawiXTEqHxS"
```

This configuration links your agent to your LiveKit Cloud project.

## Environment Variables

The agent requires the following environment variables. You'll set these in the LiveKit Cloud dashboard:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LIVEKIT_URL` | Your LiveKit Cloud WebSocket URL | `wss://arjunaai-b6xiyilp.livekit.cloud` |
| `LIVEKIT_API_KEY` | Your LiveKit API key | `APIxxxxxxxxxxxxxxxx` |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `AZURE_ENDPOINT` | Azure OpenAI endpoint | `https://your-resource.openai.azure.com` |
| `AZURE_OPENAI_DEPLOYMENT` | Azure deployment name | `gpt-4o-realtime-preview` |
| `AZURE_API_KEY` | Azure API key | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `NODE_ENV` | Environment mode | `production` |

> [!IMPORTANT]
> Get your LiveKit credentials from the [LiveKit Cloud Dashboard](https://cloud.livekit.io/projects) under your project settings.

## Deployment Steps

### Step 1: Authenticate with LiveKit Cloud

```bash
# Login to LiveKit Cloud
livekit-cli cloud auth
```

Follow the prompts to authenticate with your LiveKit Cloud account.

### Step 2: Configure Environment Variables

1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io)
2. Navigate to your project: **arjunaai-b6xiyilp**
3. Go to **Agents** → **Your Agent** → **Settings**
4. Add all required environment variables listed above

> [!WARNING]
> Never commit your `.env` file or expose your API keys in your code. Always use the LiveKit Cloud dashboard to manage production secrets.

### Step 3: Deploy the Agent

From the agent directory, run:

```bash
cd /home/sumit/Documents/Projects/azure_ai_interview/agent

# Deploy to LiveKit Cloud
livekit-cli deploy
```

The CLI will:
1. Build your Docker image using the `Dockerfile`
2. Push the image to LiveKit Cloud
3. Deploy the agent to your project

### Step 4: Verify Deployment

After deployment completes:

1. **Check Agent Status** in the LiveKit Cloud dashboard
   - Go to **Agents** section
   - Verify your agent shows as "Running"

2. **View Logs**
   ```bash
   livekit-cli cloud logs --agent CA_ZWawiXTEqHxS
   ```

3. **Test the Agent**
   - Start an interview session from your Next.js application
   - The agent should automatically connect when a participant joins

## Testing Locally Before Deployment

It's recommended to test your agent locally before deploying to LiveKit Cloud:

### 1. Build the Docker Image

```bash
cd /home/sumit/Documents/Projects/azure_ai_interview/agent
docker build -f Dockerfile -t livekit-agent-test .
```

### 2. Run Locally with Environment Variables

```bash
# Create a .env file with your credentials
cp env.example .env
# Edit .env with your actual values

# Run the agent locally
npm run dev
```

### 3. Test with Your Application

Start your Next.js application and initiate an interview session. The local agent should connect.

## Troubleshooting

### Agent Not Connecting

**Symptoms**: Agent doesn't join the room when a participant connects

**Solutions**:
1. Verify environment variables are set correctly in LiveKit Cloud dashboard
2. Check agent logs: `livekit-cli cloud logs --agent CA_ZWawiXTEqHxS`
3. Ensure your LiveKit URL matches your project subdomain
4. Verify the agent ID in `livekit.toml` matches your deployed agent

### Build Failures

**Symptoms**: Docker build fails during deployment

**Solutions**:
1. Test the build locally first: `docker build -f Dockerfile -t test .`
2. Ensure all dependencies are listed in `package.json`
3. Check that `tsconfig.json` is properly configured
4. Verify the `dist` directory is created during build: `npm run build`

### Audio Issues

**Symptoms**: No audio or garbled audio during interview

**Solutions**:
1. Check Azure OpenAI endpoint and deployment name
2. Verify Azure API key is valid and has Realtime API access
3. Check browser console for WebRTC errors
4. Ensure proper microphone permissions in the browser

### Missing Environment Variables

**Symptoms**: Agent crashes with "Missing AZURE_ENDPOINT" or similar errors

**Solutions**:
1. Double-check all environment variables are set in LiveKit Cloud dashboard
2. Ensure variable names match exactly (case-sensitive)
3. Redeploy after adding missing variables: `livekit-cli deploy`

## Updating the Agent

When you make changes to your agent code:

```bash
# 1. Test locally
npm run dev

# 2. Build and test Docker image
docker build -f Dockerfile -t livekit-agent-test .

# 3. Deploy to LiveKit Cloud
livekit-cli deploy
```

> [!TIP]
> LiveKit Cloud automatically handles zero-downtime deployments. Your new agent version will replace the old one seamlessly.

## Monitoring and Logs

### View Real-time Logs

```bash
# Stream logs in real-time
livekit-cli cloud logs --agent CA_ZWawiXTEqHxS --follow
```

### Check Agent Metrics

1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io)
2. Navigate to **Agents** → **Metrics**
3. Monitor:
   - Active sessions
   - Connection success rate
   - Error rates
   - Resource usage

## Architecture Overview

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend)     │
└────────┬────────┘
         │
         │ WebRTC
         ▼
┌─────────────────┐
│  LiveKit Cloud  │
│   (SFU Server)  │
└────────┬────────┘
         │
         │ Agent Protocol
         ▼
┌─────────────────┐
│  Your Agent     │
│  (Docker)       │
└────────┬────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│  Azure OpenAI   │
│  Realtime API   │
└─────────────────┘
```

## Additional Resources

- [LiveKit Cloud Documentation](https://docs.livekit.io/cloud/)
- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [Azure OpenAI Realtime API](https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-quickstart)
- [LiveKit CLI Reference](https://docs.livekit.io/cli/)

## Support

If you encounter issues:

1. Check the [LiveKit Community Forum](https://livekit.io/community)
2. Review [GitHub Issues](https://github.com/livekit/agents-js/issues)
3. Contact LiveKit Support through the dashboard

---

**Last Updated**: December 2025  
**Agent Version**: 1.0.0  
**LiveKit Agents SDK**: @livekit/agents ^1.0.24
