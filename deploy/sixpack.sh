#!/bin/bash

git pull origin master

docker-compose -f $(pwd)/sixpack/docker-compose.yml build
docker-compose -f $(pwd)/sixpack/docker-compose.yml down
docker-compose -f $(pwd)/sixpack/docker-compose.yml up -d
