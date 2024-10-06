# Use the official Node.js image from the Docker Hub
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the server will run on
EXPOSE 9000

# Command to run the server
CMD ["node", "server/server.js"]