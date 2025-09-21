Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # API routes
  namespace :api do
    namespace :v1 do
      post "signup", to: "users#create"
      get  "me",     to: "users#me"
      patch "me/avatar", to: "users#update_avatar"
      delete "me/avatar", to: "users#remove_avatar"

      post   "login",  to: "sessions#create"
      delete "logout", to: "sessions#destroy"

      resources :spaces, only: [ :index, :create, :destroy, :show ] do
        collection do
          get :limits
          get :check_name
          get :recently_deleted
          delete :bulk_delete
          post :bulk_recover
          delete :bulk_purge
        end
        member do
          post :invite
          get  :members
          delete :remove_member
          post :recover
          delete :purge
        end

        resources :transactions, only: [ :index, :create, :show, :destroy ]
      end
    end
  end

  get "health" => "rails/health#show"
  get "up" => "rails/health#show", as: :rails_health_check

  # Serve React app - catch all routes and serve index.html
  get "*path", to: "application#fallback_index_html", constraints: ->(request) do
    !request.xhr? && request.format.html?
  end

  root "application#fallback_index_html"
end
