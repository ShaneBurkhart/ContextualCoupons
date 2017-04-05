#!/bin/bash

# Save current images as backups so we can quickly revert back
docker tag sparkschool_app sparkschool_app_backup
docker tag sparkschool_nginx sparkschool_nginx_backup

git pull origin master

# Build jekyll
docker run --rm -v `pwd`:/app ruby bash -c "bundle install --gemfile=/app/Gemfile && jekyll build --source /app/courses --destination /app/courses/_site"

# Build assets and containers
docker-compose -f docker-compose.prod.yml build app

sudo rm -rf public/*
docker run -v $(pwd)/public:/app/public sparkschool_app gulp build
docker-compose -f docker-compose.prod.yml build nginx

docker-compose -f docker-compose.prod.yml down
# Clean up docker stopped docker containers
docker rm $(docker ps -aq)
docker-compose -f docker-compose.prod.yml up -d

# Remove untagged docker images
echo "============ Cleanup Docker Images =============="
docker rmi -f $(docker images | grep "<none>" | awk "{print \$3}") || true
