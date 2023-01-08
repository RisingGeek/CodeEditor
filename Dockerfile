FROM ubuntu:latest
USER root
WORKDIR /app
RUN apt-get update
RUN apt-get install curl -y
RUN apt-get install nodejs -y
RUN apt-get install npm -y
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get -y install gcc mono-mcs && \
    rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install default-jre -y
RUN apt-get update && apt-get install default-jdk -y
RUN apt-get update && apt-get install python2 -y
COPY /editor-backend/package.json .
COPY /editor-backend .
RUN npm install
CMD ["npm","start"]
