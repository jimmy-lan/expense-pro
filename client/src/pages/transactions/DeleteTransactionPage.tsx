import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AppNavbar } from "../../components";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi, type TransactionDto } from "../../lib/api";
import { useScrollTopOnMount } from "../../hooks";

export const DeleteTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { spaceId, transactionId } = useParams();
  const id = Number(spaceId);
  const txId = Number(transactionId);

  const location = useLocation();
  const txFromState = (location.state as any)?.transaction as
    | TransactionDto
    | undefined;

  useScrollTopOnMount();

  const txQuery = useQuery({
    queryKey: ["transaction", id, txId],
    queryFn: () => transactionsApi.show(id, txId),
    enabled: Boolean(id && txId) && !txFromState,
  });

  const transaction: TransactionDto | undefined =
    txFromState || txQuery.data?.transaction;

  const mutation = useMutation({
    mutationFn: async () => transactionsApi.delete(id, txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", id] });
      navigate(`/my/space/${id}`);
    },
  });

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Typography variant="h4" className="font-bold text-gray-900 mb-1">
          Delete Transaction
        </Typography>
        <Typography variant="small" className="text-gray-600 mb-6">
          This action cannot be undone.
        </Typography>

        <Card className="shadow-sm mb-6">
          <CardBody>
            {transaction ? (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Typography
                    variant="h6"
                    className="font-semibold text-gray-900 truncate"
                  >
                    {transaction.title}
                  </Typography>
                  <Typography variant="small" className="text-gray-600">
                    {dayjs(transaction.occurredAt).format("MMM D, YYYY")} ·{" "}
                    {transaction.creator?.name}
                  </Typography>
                </div>
                <div className="text-right">
                  <Typography
                    variant="h6"
                    className={
                      Number(transaction.amount) < 0
                        ? "text-gray-900"
                        : "text-green-700"
                    }
                  >
                    {Number(transaction.amount) < 0 ? "-" : ""}$
                    {Math.abs(Number(transaction.amount)).toFixed(2)}
                  </Typography>
                </div>
              </div>
            ) : (
              <Typography variant="small" className="text-gray-700">
                Loading transaction details...
              </Typography>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-between gap-3">
          <Button
            color="red"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            {!mutation.isPending && (
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
            )}
            Delete Transaction
          </Button>
          <Button
            variant="text"
            color="gray"
            onClick={() => navigate(`/my/space/${id}`)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
