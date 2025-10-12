module Activity
  class TransactionEventRecorder
    def self.record!(verb:, tx:, actor:)
      new(verb: verb, tx: tx, actor: actor).record!
    end

    def initialize(verb:, tx:, actor:)
      @verb = verb
      @tx = tx
      @actor = actor
    end

    def record!
      ActivityHistory.record!(
        space: @tx.space,
        actor: @actor,
        verb: @verb,
        subject: @tx,
        metadata: build_metadata
      )
    end

    private

    def build_metadata
      {
        transactionId: @tx.id,
        txType: (@tx.amount_cents.to_i < 0 ? "spend" : "credit"),
        title: @tx.title,
        description: @tx.description,
        amount: format_amount(@tx.amount_cents.to_i),
        occurredAt: occurred_on(@tx.occurred_at),
        fullCover: !!@tx.full_cover
      }
    end

    def occurred_on(time)
      (time&.to_date || Time.current.to_date).strftime("%Y-%m-%d")
    end

    def format_amount(cents)
      sign = cents < 0 ? "-" : ""
      dollars = (cents.abs.to_f / 100.0)
      "#{sign}$#{format('%.2f', dollars)}"
    end
  end
end
