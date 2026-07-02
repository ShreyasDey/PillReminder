FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
