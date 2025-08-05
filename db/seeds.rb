# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

regular = Plan.find_or_create_by!(key: "regular") do |p|
  p.name = "Regular"
  p.max_spaces = 20
  p.max_transactions_per_space = 500
  p.expires_after_days = 60
end

premium = Plan.find_or_create_by!(key: "premium") do |p|
  p.name = "Premium"
  p.max_spaces = 50
  p.max_transactions_per_space = 10_000
  p.expires_after_days = nil
end

u1 = User.find_or_initialize_by(email: "user1.test@example.com")
u1.password = "secret_test"
u1.password_confirmation = "secret_test"
u1.first_name = "User"
u1.last_name = "1"
u1.plan ||= regular
u1.save!

u2 = User.find_or_initialize_by(email: "user2.test@example.com")
u2.password = "secret_test"
u2.password_confirmation = "secret_test"
u2.first_name = "User"
u2.last_name = "2"
u2.plan ||= regular
u2.save!

u3 = User.find_or_initialize_by(email: "user3.test@example.com")
u3.password = "secret_test"
u3.password_confirmation = "secret_test"
u3.first_name = "User"
u3.last_name = "3"
u3.plan ||= regular
u3.save!

[ "u1 Space 1", "u1 Space 2", "u1 Space 3", "u1 Space 4", "u1 Space 5", "u1 Space 6", "u1 Space 7", "u1 Space 8", "u1 Space 9", "u1 Space 10", "u1 Space 11", "u1 Space 12", "u1 Space 13", "u1 Space 14", "u1 Space 15", "u1 Space 16", "u1 Space 17", "u1 Space 18", "u1 Space 19", "u1 Space 20" ].each do |name|
    space = Space.find_or_create_by!(name: name, created_by: u1)
    SpaceMembership.find_or_create_by!(user: u1, space: space, role: "admin")
end

[ "u3 Space 1", "u3 Space 2", "u3 Space 3", "u3 Space 4", "u3 Space 5", "u3 Space 6", "u3 Space 7", "u3 Space 8", "u3 Space 9", "u3 Space 10", "u3 Space 11", "u3 Space 12", "u3 Space 13", "u3 Space 14", "u3 Space 15", "u3 Space 16", "u3 Space 17", "u3 Space 18", "u3 Space 19", "u3 Space 20" ].each do |name|
    space = Space.find_or_create_by!(name: name, created_by: u3)
    SpaceMembership.find_or_create_by!(user: u3, space: space, role: "admin")
end

SpaceMembership.find_or_create_by!(user: u2, space: Space.find_by!(name: "u1 Space 1"), role: "member")
SpaceMembership.find_or_create_by!(user: u3, space: Space.find_by!(name: "u1 Space 1"), role: "member")
SpaceMembership.find_or_create_by!(user: u2, space: Space.find_by!(name: "u3 Space 1"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 1"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 2"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 3"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 4"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 5"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 6"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 7"), role: "member")
SpaceMembership.find_or_create_by!(user: u1, space: Space.find_by!(name: "u3 Space 8"), role: "member")
