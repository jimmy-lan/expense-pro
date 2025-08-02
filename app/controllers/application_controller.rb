class ApplicationController < ActionController::API
  include ActionController::MimeResponds
  include ActionController::Cookies

  def fallback_index_html
    render body: rails_blob_path, content_type: "text/html"
  end

  private

  def current_user
    @current_user ||= begin
      user_id = cookies.signed[:user_id]
      User.find_by(id: user_id) if user_id
    end
  end

  def authenticate_user!
    return if current_user.present?

    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def set_login_cookie(user)
    cookies.signed[:user_id] = {
      value: user.id,
      httponly: true,
      same_site: :lax,
      secure: Rails.env.production?,
      expires: 2.weeks.from_now
    }
  end

  def clear_login_cookie
    cookies.delete(:user_id, same_site: :lax)
  end

  def rails_blob_path
    index_path = Rails.root.join("public", "index.html")
    if index_path.exist?
      index_path.read
    else
      # Fallback content if build files don't exist yet
      '<!DOCTYPE html><html><head><title>Share Expenses App</title></head><body><div id="root"><h1 style="text-align: center; margin-top: 50vh; transform: translateY(-50%);">Share Expenses App</h1></div></body></html>'
    end
  end
end
