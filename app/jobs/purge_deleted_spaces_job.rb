class PurgeDeletedSpacesJob < ApplicationJob
  queue_as :default

  # Hard-delete spaces whose purge_after_at is due
  def perform(batch_size: 500)
    cutoff = Time.current

    Space.recently_deleted
      .where("purge_after_at IS NOT NULL AND purge_after_at <= ?", cutoff)
      .in_batches(of: batch_size)
      .each_record do |space|
        begin
          Space.transaction do
            space.destroy!
          end
        rescue => e
          Rails.logger.error("Failed to purge space #{space.id}: #{e.class} - #{e.message}")
        end
      end
  end
end
