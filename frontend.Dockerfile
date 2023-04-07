# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app/frontend

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/frontend/node_modules/.bin:$PATH

# install app dependencies
COPY frontend/package.json ./
COPY frontend/package-lock.json ./

RUN npm install

RUN npm install nodemon --save-dev

# add app
COPY frontend ./

# start app
CMD ["npm", "start"]
#CMD ["nodemon", "--exec", "npm", "start"]

EXPOSE 3000