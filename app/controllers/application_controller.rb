class ApplicationController < ActionController::API
  include ActionController::MimeResponds

  def hello
    render json: { message: "hello world!" }
  end

  def fallback_index_html
    render body: rails_blob_path, content_type: 'text/html'
  end

  private

  def rails_blob_path
    index_path = Rails.root.join('public', 'index.html')
    if index_path.exist?
      index_path.read
    else
      # Fallback content if build files don't exist yet
      '<!DOCTYPE html><html><head><title>Share Expenses App</title></head><body><div id="root"><h1 style="text-align: center; margin-top: 50vh; transform: translateY(-50%);">Share Expenses App</h1></div></body></html>'
    end
  end
end
