# functions-container/Dockerfile

# 1) Use a slim Node 22 image
FROM node:22-alpine

# 2) Create app directory
WORKDIR /usr/src/app

# 3) Copy package manifest & install deps
COPY package.json package-lock.json ./
RUN npm install --production

# 4) Copy source
COPY . .

# 5) Expose the port your index.js listens on
EXPOSE 8080

# 6) Start the server
CMD ["node", "index.js"]
