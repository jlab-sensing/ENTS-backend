# pull official base image
FROM node:16.17.0-bullseye-slim AS development

# set working directory
WORKDIR /app

ENV PUBLIC_URL ""

# add `/app/node_modules/.bin` to $PATH
# ENV PATH /app/frontend/node_modules/.bin:$PATH

# install app dependencies
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY vite.config.js /app/vite.config.js

RUN npm install
# RUN npm install nodemon --save-dev
COPY index.html ./index.html
COPY src ./src
COPY public ./public

# start app
CMD ["npm", "start", "--", "--port", "80"]
#CMD ["nodemon", "--exec", "npm", "start"]

EXPOSE 3000


# Build Stage ####################
# pull official base image
FROM node:16.17.0-bullseye-slim AS builder
ARG PUBLIC_URL
ENV PUBLIC_URL ${PUBLIC_URL}

# set working directory
WORKDIR /app

# ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
# copies package.json and package-lock.json to Docker environment
COPY package.json /package.json
COPY package-lock.json /package-lock.json

# Installs all node packages
RUN npm install 

COPY src ./src
COPY public ./public

# copying over our nginx config file
COPY . ./

RUN npm run build

# Production Stage ####################
# pull the official nginx:1.19.0 base image
FROM nginx:1.19.0 as production

# removing default nginx config file
RUN rm /etc/nginx/conf.d/default.conf

# copy nginx config
COPY --from=builder /app/frontend_server.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build/ /usr/share/nginx/html

# Containers run nginx with global directives and daemon off
EXPOSE 3000 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
