FROM --platform=linux/amd64 node:alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . ./

RUN npx prisma generate

RUN npm run build

FROM --platform=linux/amd64 node:alpine
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
