import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AppNavbar } from "../../components";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi, type TransactionDto, ApiError } from "../../lib/api";
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

  const closePage = () => {
    window.history.state?.idx > 0
      ? navigate(-1)
      : navigate(`/my/space/${id}`, { replace: true });
  };

  useScrollTopOnMount();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const txQuery = useQuery<
    { transaction: TransactionDto },
    ApiError,
    { transaction: TransactionDto },
    (string | number)[]
  >({
    queryKey: ["transaction", id, txId],
    queryFn: () => transactionsApi.show(id, txId),
    enabled: Boolean(id && txId) && !txFromState,
  });

  useEffect(() => {
    if (txQuery.isError && txQuery.error) {
      const err = txQuery.error;
      if (err instanceof ApiError && err.status === 404) {
        navigate(`/my/space/${id}`);
      } else {
        setErrorMessage(err.message || "Failed to load transaction");
      }
    }
  }, [txQuery.isError, txQuery.error, navigate, id]);

  const transaction: TransactionDto | undefined =
    txFromState || txQuery.data?.transaction;

  const mutation = useMutation({
    mutationFn: async () => transactionsApi.delete(id, txId),
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", id] });
      closePage();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 404) {
        closePage();
        return;
      }
      setErrorMessage((err as any)?.message || "Failed to delete transaction");
    },
  });

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Typography variant="h4" className="font-bold text-gray-900 mb-1">
          Delete Transaction
        </Typography>
        <Typography variant="small" className="text-gray-600 mb-4">
          This action cannot be undone.
        </Typography>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
            {errorMessage}
          </div>
        )}

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
            onClick={closePage}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
