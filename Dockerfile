FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose Vite's default development port
EXPOSE 5174

# Command to start the Vite development server
CMD ["npm", "run", "dev"]