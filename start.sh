#!/bin/bash
set -e

echo "Building React frontend..."
cd client
npm install
npm run build

echo "Copying React build to Rails public directory..."
cp -r build/* ../public/
cd ..

echo "Setting up Rails..."
bundle install
bundle exec rails db:prepare

echo "Starting Rails server..."
bundle exec rails server -b 0.0.0.0 -p ${PORT:-3000} 