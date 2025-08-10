class Api::V1::UsersController < ApplicationController
  def create
    user = User.new(user_params)
    if user.save
      set_login_cookie(user)
      render json: { user: serialize_user(user) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def me
    if current_user
      render json: { user: serialize_user(current_user) }
    else
      render json: { user: nil }
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :first_name, :last_name, :password, :password_confirmation)
  end

  def serialize_user(user)
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url
    }
  end
end
