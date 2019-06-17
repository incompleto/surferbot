FROM node:latest

RUN mkdir -p /app
WORKDIR /app

RUN apk add sqlite \
    && apk add sqlite-dev

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

CMD ["foreman", "start"]
