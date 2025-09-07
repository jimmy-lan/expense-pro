import React from "react";
import {
  Select as MTSelect,
  Option as MTOption,
} from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";
import { Control, Controller } from "react-hook-form";

type NativeMTSelectProps = React.ComponentPropsWithoutRef<typeof MTSelect>;
type NativeMTSelectRef = React.ElementRef<typeof MTSelect>;
type NativeMTOptionRef = React.ElementRef<typeof MTOption>;
type NativeMTOptionProps = React.ComponentPropsWithoutRef<typeof MTOption>;

const SELECT_CLASSES =
  "!border-none focus-within:!border-none focus:!border-none [&>span]:relative [&>span]:left-0 [&>span]:top-0 pt-5 px-4 pb-2";

const BASE_CONTAINER_CLASSES =
  "!border focus-within:!border-2 border-gray-400 rounded-md focus-within:border-primary hover:border-primary h-16 group";

const BASE_LABEL_CLASSES = `
    top-0
    peer-aria-[expanded=true]:!top-2 group-[.has-value]:!top-2
    peer-focus:!text-primary peer-aria-[expanded=true]:!text-primary
    !font-semibold left-4
    before:!content-none after:!content-none before:!border-0 after:!border-0
`;

export type AppSelectProps = Omit<
  NativeMTSelectProps,
  "color" | "size" | "variant"
> & {
  size?: NativeMTSelectProps["size"];
  variant?: NativeMTSelectProps["variant"];
  helperText?: string;
  control: Control<any>;
  name: string;
};

export const Select = React.forwardRef<NativeMTSelectRef, AppSelectProps>(
  (
    {
      className,
      labelProps,
      placeholder,
      helperText,
      containerProps,
      control,
      name,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <div>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <MTSelect
              size="lg"
              variant="outlined"
              value={field.value}
              onChange={(val) => field.onChange(val)}
              className={twMerge(SELECT_CLASSES, className)}
              containerProps={{
                className: twMerge(
                  BASE_CONTAINER_CLASSES,
                  field.value && "has-value"
                ),
              }}
              labelProps={{
                className: BASE_LABEL_CLASSES,
              }}
              ref={ref}
              {...rest}
            >
              {children}
            </MTSelect>
          )}
        />
        {helperText && (
          <p className="mt-1 text-xs text-red-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export const Option = React.forwardRef<NativeMTOptionRef, NativeMTOptionProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    return <MTOption className={twMerge("", className)} {...rest} ref={ref} />;
  }
);

Option.displayName = "Option";
