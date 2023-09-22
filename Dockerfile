#ARG BASE=node:18.12.1-alpine
ARG BASE=node:18

# build stage
FROM ${BASE}

WORKDIR /build
COPY package*.json ./

RUN npm install

# app stage
FROM ${BASE}

# Bundle app source
COPY . .

EXPOSE $PORT

CMD ["npm", "run", "start"]
