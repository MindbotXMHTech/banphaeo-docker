FROM node:14-alpine3.12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# copying packages first helps take advantage of docker layers
COPY package*.json ./

ARG DOMAIN
ENV DOMAIN=${DOMAIN}
ARG PORT
ENV PORT=${PORT}
ARG VALIDATE_MINS
ENV VALIDATE_MINS=${VALIDATE_MINS}
ARG JWT_SECRET
ENV JWT_SECRET=${JWT_SECRET}

RUN npm install
RUN npm install pg-format
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080

CMD ["npm", "run", "start" ]