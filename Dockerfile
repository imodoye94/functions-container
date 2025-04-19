# functions-container/Dockerfile

FROM node:22-alpine
WORKDIR /usr/src/app

# Only copy package.json (no lock file)
COPY package.json ./

# Install deps
RUN npm install --production

# Now copy the rest of your source
COPY . .

EXPOSE 9033
CMD ["node", "index.js"]
