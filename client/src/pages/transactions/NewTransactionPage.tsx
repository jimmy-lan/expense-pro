import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppNavbar } from "../../components";
import { Typography } from "@material-tailwind/react";
import { Input, TextArea } from "../../components/ui/Input";
import { Select, Option } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../../lib/api";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useScrollTopOnMount } from "../../hooks";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type TxType = "spend" | "credit";

interface NewTxFormValues {
  type: TxType | "";
  title: string;
  description?: string | null;
  amount: string;
  occurredAt: string; // YYYY-MM-DD
  fullCover: boolean;
}

const schema: yup.ObjectSchema<NewTxFormValues> = yup.object({
  type: yup.mixed<TxType>().oneOf(["spend", "credit"]).required(),
  title: yup
    .string()
    .required("Title is required")
    .max(100, "Max 100 characters"),
  description: yup
    .string()
    .max(500, "Max 500 characters")
    .optional()
    .nullable(),
  amount: yup
    .string()
    .required("Amount is required")
    .matches(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount"),
  occurredAt: yup.string().required("Date is required"),
  fullCover: yup.boolean().required(),
});

export const NewTransactionPage: React.FC = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(spaceId);

  useScrollTopOnMount();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewTxFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      type: "spend",
      title: "",
      description: "",
      amount: "",
      occurredAt: dayjs().format("YYYY-MM-DD"),
      fullCover: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: NewTxFormValues) => {
      const raw = values.amount.trim();
      const signed = values.type === "spend" ? `-${raw}` : raw;
      return transactionsApi.create(id, {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        amount: signed,
        occurred_at: dayjs(values.occurredAt, "YYYY-MM-DD")
          .startOf("day")
          .toISOString(),
        full_cover: values.fullCover,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", id] });
      navigate(`/my/space/${id}`);
    },
  });

  const onSubmit = (values: NewTxFormValues) => mutation.mutate(values);

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />
      <div className="mx-auto px-4 py-6 md:px-8 lg:px-12 2xl:px-16">
        <div className="mb-6">
          <Typography variant="h4" className="font-bold text-gray-900">
            Add Transaction
          </Typography>
          <Typography variant="small" className="text-gray-600 mt-1">
            Create a transaction in your shared space
          </Typography>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 py-4"
        >
          <Select
            label="Type"
            name="type"
            helperText={errors.type?.message}
            control={control}
            error={!!errors.type}
          >
            <Option value="spend">Spend</Option>
            <Option value="credit">Credit</Option>
          </Select>

          <div>
            <Input
              label="Title"
              {...register("title")}
              error={!!errors.title}
              helperText={errors.title?.message}
              required
            />
          </div>

          <TextArea
            label="Description"
            {...register("description")}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          <div>
            <Input
              label="Amount"
              type="text"
              placeholder="e.g. 12.34"
              {...register("amount")}
              error={!!errors.amount}
              helperText={errors.amount?.message}
              required
            />
          </div>
          <div>
            <Input
              label="Occurred at"
              type="date"
              {...register("occurredAt")}
              error={!!errors.occurredAt}
              helperText={errors.occurredAt?.message}
              required
            />
          </div>

          <div className="flex items-start sm:items-center gap-3">
            <input
              id="fullCover"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-gray-400 text-primary focus:ring-primary"
              {...register("fullCover")}
            />
            <div className="flex-1">
              <label
                htmlFor="fullCover"
                className="block text-gray-800 font-medium"
              >
                Full cover
              </label>
              <p className="text-gray-600 text-sm mt-0.5">
                If enabled, the creator covers the entire cost. No splitting
                needed.
              </p>
            </div>
          </div>

          {mutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {(mutation.error as any)?.message ||
                "Failed to create transaction"}
            </div>
          )}

          <div className="flex justify-between gap-3 mt-3">
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {!isSubmitting && !mutation.isPending && (
                <FontAwesomeIcon icon={faCoins} className="mr-2" />
              )}
              Create
            </Button>
            <Button
              type="button"
              variant="text"
              color="gray"
              onClick={() => navigate(`/my/space/${id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
