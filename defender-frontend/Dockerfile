FROM node:21

COPY . /app
WORKDIR /app

RUN npm cache clean --force && \
    npm install -g npm@latest && \
    npm install
