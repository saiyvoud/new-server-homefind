# Stage 1: Build
FROM node:20.10.0 as build

WORKDIR /app

COPY package*.json ./
RUN npm install --production



COPY . .

# Stage 2: Production
FROM node:20.10.0

WORKDIR /app

COPY --from=build /app /app

RUN npx prisma generate
EXPOSE 81

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
   CMD curl -f http://localhost:81/health || exit 1

CMD ["node", "src/server.js"]


