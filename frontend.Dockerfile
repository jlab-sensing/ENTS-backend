# pull official base image
FROM node:13.12.0-alpine AS development

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

# pull official base image
FROM node:13.12.0-alpine AS builder

# set working directory
WORKDIR /app


# install app dependencies
#copies package.json and package-lock.json to Docker environment
COPY frontend/package.json /app/package.json
COPY frontend/package-lock.json /app/package-lock.json

# Installs all node packages
RUN npm install 


# Copies everything over to Docker environment
COPY frontend /app
RUN npm run build

# starting second, nginx build-stage
FROM builder AS production
RUN echo "production"

FROM nginx:1.19.0
RUN echo "production"

# removing default nginx config file
RUN rm /etc/nginx/conf.d/default.conf

# copying our nginx config
COPY --from=builder /frontend_server.conf /etc/nginx/conf.d/

# copying production build from last stage to serve through nginx
COPY --from=builder /build/ /usr/share/nginx/html

# exposing port 8080 on container
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]