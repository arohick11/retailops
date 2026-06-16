# Stage 1: Install production dependencies
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Stage 2: Final minimal runtime image
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy node_modules from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy app source code
COPY . .

# Expose backend port
EXPOSE 5001

# Run as non-root user for security
USER node

# Start the application
CMD ["node", "server.js"]
