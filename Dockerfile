FROM node:latest

RUN apt update && apt install ffmpeg -y
WORKDIR /application
COPY package*.json ./
RUN npm install
COPY ./ ./

ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]