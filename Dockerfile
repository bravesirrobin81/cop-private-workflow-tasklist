FROM quay.io/ukhomeofficedigital/docker-node:master

ARG STORAGE_KEY

WORKDIR /app

RUN mkdir -p /app && \
    chown -R node:node /app

ADD . /app/

RUN npm install && npm run build

ENV NODE_ENV='production'

USER 1000

EXPOSE 8080

ENTRYPOINT exec node dist/server.js

