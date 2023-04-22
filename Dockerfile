FROM node:18.12.0 as base

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

FROM base as production

ENV NODE_PATH=./build

RUN npm run build