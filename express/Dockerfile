FROM node:19

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

COPY package*.json ./
COPY app.js ./
COPY public ./public
COPY views ./views

RUN npm install
EXPOSE 8080
EXPOSE 8443
CMD [ "npm", "start" ]
