# This Dockerfile is based on LiveKit's official agent template
# See: https://github.com/livekit-examples/agent-starter-node
# syntax=docker/dockerfile:1

# Use the official Node.js v20 base image
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim AS base

# Configure pnpm installation directory and ensure it is on PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install required system packages and pnpm
# ca-certificates: enables TLS/SSL for securely fetching dependencies
RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Pin pnpm version for reproducible builds
RUN npm install -g pnpm@10

# Create working directory
WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
# Use npm if pnpm-lock.yaml doesn't exist, otherwise use pnpm
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else npm ci; fi

# Copy all application files
COPY . .

# Build the project
RUN if [ -f pnpm-lock.yaml ]; then pnpm build; \
    else npm run build; fi

# Create a non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Set proper permissions
RUN chown -R appuser:appuser /app
USER appuser

# Switch back to root to remove dev dependencies
USER root
RUN if [ -f pnpm-lock.yaml ]; then pnpm prune --prod; \
    else npm prune --production; fi && \
    chown -R appuser:appuser /app
USER appuser

# Set Node.js to production mode
ENV NODE_ENV=production

# Run the application using npm (since we don't have pnpm-lock.yaml)
CMD ["npm", "start"]
