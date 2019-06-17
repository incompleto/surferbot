FROM node:latest

RUN mkdir -p /app
WORKDIR /app

RUN apt-get install sqlite
RUN apt-get install sqlite-dev

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

CMD ["foreman", "start"]
