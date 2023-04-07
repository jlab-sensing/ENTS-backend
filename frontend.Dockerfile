# pull official base image
FROM node:lts

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
#ENV PATH /app/frontend/node_modules/.bin:$PATH

# install app dependencies
COPY frontend/package.json /app/package.json
COPY frontend/package-lock.json /app/package-lock.json

RUN npm install
RUN npm install nodemon --save-dev

COPY frontend /app



# add app
#COPY frontend/* ./

# start app
CMD ["npm", "start"]
#CMD ["nodemon", "--exec", "npm", "start"]

EXPOSE 3000
