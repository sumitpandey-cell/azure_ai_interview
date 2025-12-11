# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy other necessary files (if any)
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose port (Railway/Render will set PORT env var)
EXPOSE 8080

# Start the agent
CMD ["npm", "start"]
