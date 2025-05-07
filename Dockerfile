# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your application runs on (default for Express is 3000)
EXPOSE 8080

# Set environment variables (optional, can also be passed during runtime)
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "dev"]