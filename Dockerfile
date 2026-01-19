# Use official Node.js lightweight image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
