class AddFullCoverToTransactions < ActiveRecord::Migration[8.0]
  def change
    add_column :transactions, :full_cover, :boolean, null: false, default: false
  end
end
