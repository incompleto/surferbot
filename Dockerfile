FROM node:latest

RUN mkdir -p /app
WORKDIR /app

RUN apt-get update
RUN apt-get install sqlite3

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

CMD ["foreman", "start"]
