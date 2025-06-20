FROM node:18-alpine

# Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies first
COPY package*.json ./

# Install dependencies (make sure puppeteer is installed)
RUN npm install --production

# Copy the full app
COPY . .

# Let Puppeteer know where Chromium lives
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose the port
EXPOSE 9090

# Start the app
CMD ["node", "app.js"]
