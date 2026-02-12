# Stage 1: Compile and Build angular codebase

# Use official node image as the base image
FROM node:22.12.0-alpine as build

# Set the working directory
WORKDIR /usr/local/app

# Add the source code to app
COPY ./ /usr/local/app/

# Install all the dependencies
RUN npm install

RUN npm run set-version

RUN npm run build

# Stage 2: Serve app with nginx server

# Use official nginx image as the base image
FROM nginx:latest

# Copy the build output to replace the default nginx contents.
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/local/app/dist/opteeam-front /usr/share/nginx/html

# Ajoutez le fichier de template pour les variables d'environnement
COPY ./env.template.js /usr/share/nginx/html/env.template.js

# Configurez l'exécution pour injecter les variables d'environnement au runtime
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && exec nginx -g 'daemon off;'"]
