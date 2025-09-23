ruby "3.4.5"

source "https://rubygems.org"

gem "rails", "~> 8.0.3"
gem "pg",     "~> 1.6"
gem "puma",   ">= 5.0"
gem "bcrypt", "~> 3.1.7"

# Only install zoneinfo-data on Windows/JRuby
gem "tzinfo-data", platforms: %i[mingw mswin x64_mingw jruby]

# Database-backed adapters
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"

gem "bootsnap", require: false
gem "kamal",    require: false
gem "thruster", require: false
# gem "image_processing", "~> 1.2"

gem "rack-cors"
gem "solargraph"

group :development, :test do
  gem "debug", platforms: %i[mri mingw mswin x64_mingw jruby], require: "debug/prelude"
  gem "brakeman",                 require: false
  gem "rubocop-rails-omakase",    require: false
  gem "foreman",                  require: false
end
