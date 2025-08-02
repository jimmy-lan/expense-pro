import React from "react";
import { Input as MTInput } from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";

type NativeMTInputProps = React.ComponentPropsWithoutRef<typeof MTInput>;
type NativeMTInputRef = React.ElementRef<typeof MTInput>;

export type AppInputProps = Omit<
  NativeMTInputProps,
  "color" | "size" | "variant"
> & {
  size?: NativeMTInputProps["size"];
  variant?: NativeMTInputProps["variant"];
  helperText?: string;
};

export const Input = React.forwardRef<NativeMTInputRef, AppInputProps>(
  (
    {
      size = "lg",
      variant = "outlined",
      className,
      labelProps,
      placeholder,
      helperText,
      ...rest
    },
    ref
  ) => {
    return (
      <>
        <MTInput
          ref={ref}
          variant="standard"
          size={size}
          placeholder={placeholder || " "}
          className={twMerge("!px-4 !border-none", className)}
          containerProps={{
            className: twMerge(
              "!border focus-within:!border-2 border-gray-400 rounded-md focus-within:border-primary overflow-hidden h-14 hover:border-primary",
              rest.error && "!border-red-500"
            ),
          }}
          labelProps={{
            className:
              "top-[-0.5rem] peer-[:not(:placeholder-shown)]:top-2 peer-focus:top-2 peer-focus:text-primary font-semibold left-4 after:border-none",
            ...labelProps,
          }}
          {...rest}
        />
        {helperText && (
          <p className="mt-1 text-xs text-red-600">{helperText}</p>
        )}
      </>
    );
  }
);

Input.displayName = "Input";
