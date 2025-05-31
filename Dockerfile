FROM node:latest

RUN apt update && apt install ffmpeg -y
WORKDIR /application
COPY package*.json ./
RUN npm install

RUN mkdir output
COPY ./ ./

CMD [ "npm", "run", "start" ]