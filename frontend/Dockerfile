FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN yarn build

# Use lightweight static server (serve) to serve the built app
# Install serve globally for serving static files
RUN npm install -g serve

# Expose port 5173 as specified in requirements
EXPOSE 5173

# Serve the built app
CMD ["serve", "-s", "dist", "-p", "5173"]