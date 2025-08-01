class Api::V1::SessionsController < ApplicationController
  def create
    email = params[:email].to_s.strip.downcase
    user = User.find_by("lower(email) = ?", email)

    if user&.authenticate(params[:password])
      set_login_cookie(user)
      render json: { user: serialize_user(user) }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    clear_login_cookie
    head :no_content
  end

  private

  def serialize_user(user)
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }
  end
end 