# Stage 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve the static files using Nginx
FROM nginx:stable-alpine

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
