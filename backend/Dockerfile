# Encore Backend Dockerfile
FROM node:18-alpine

# Install Encore CLI
RUN npm install -g encore.dev@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Set production environment
ENV NODE_ENV=production
ENV ENCORE_ENVIRONMENT=production

# Start the application
CMD ["encore", "run", "--listen=0.0.0.0:4000"]