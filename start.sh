#!/bin/bash
set -Eeuo pipefail

export NODE_ENV=${NODE_ENV:-production}
export RAILS_ENV=${RAILS_ENV:-production}
export BUNDLE_WITHOUT=${BUNDLE_WITHOUT:-"development:test"}
export RAILS_LOG_TO_STDOUT=${RAILS_LOG_TO_STDOUT:-true}

echo "Building React frontend..."
cd client
npm ci --no-audit --silent --omit=dev
CI=true npm run build --silent

echo "Copying React build to Rails public directory..."
cp -r build/* ../public/
cd ..

echo "Setting up Rails..."
bundle install
bundle exec rails db:migrate

echo "Preparing Solid Queue database/schema..."
bundle exec rails db:queue:prepare

echo "Starting Rails server..."
export SOLID_QUEUE_IN_PUMA=${SOLID_QUEUE_IN_PUMA:-true}
bundle exec rails server -b 0.0.0.0 -p ${PORT}
