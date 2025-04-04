FROM node:20

WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application files to the container
COPY . .

# Expose the port your app runs on
EXPOSE 9090

# Define the command to run your backend server
CMD ["node", "app.js"]
