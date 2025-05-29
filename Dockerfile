FROM node:20
 
WORKDIR /usr/src/app
 
# Install ffmpeg before anything else
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
 
# Copy package.json and package-lock.json files to install dependencies
COPY package*.json ./
 
# Install dependencies (production only)
RUN npm install --production
 
# Copy the rest of the application files
COPY . .
 
# Expose the app port
EXPOSE 9090
 
# Run the backend
CMD ["node", "app.js"]