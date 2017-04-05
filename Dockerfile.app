FROM node:7.3.0
MAINTAINER Shane Burkhart <shane@trysparkschool.com>

ADD . /app
WORKDIR /app

RUN npm install -g nodemon
RUN npm install -g gulp
RUN npm install

EXPOSE 80

CMD ["node", "index.js"]
