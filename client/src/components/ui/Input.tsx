import React from "react";
import { Input as MTInput } from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";

type NativeMTInputProps = React.ComponentPropsWithoutRef<typeof MTInput>;
type NativeMTInputRef = React.ElementRef<typeof MTInput>;

export type AppInputProps = Omit<
  NativeMTInputProps,
  "color" | "size" | "variant"
> & {
  color?: NativeMTInputProps["color"] | "primary" | "secondary";
  size?: NativeMTInputProps["size"];
  variant?: NativeMTInputProps["variant"];
};

export const Input = React.forwardRef<NativeMTInputRef, AppInputProps>(
  (
    {
      color = "primary",
      size = "lg",
      variant = "outlined",
      className,
      labelProps,
      ...rest
    },
    ref
  ) => {
    const isBrand = color === "primary" || color === "secondary";

    const passthroughProps: Partial<NativeMTInputProps> = {};
    if (!isBrand && color) {
      passthroughProps.color = color;
    }

    return (
      <MTInput
        ref={ref}
        variant="standard"
        size={size}
        className={twMerge("!px-4 !border-none", className)}
        containerProps={{
          className:
            "!border focus-within:!border-2 border-gray-400 rounded-md focus-within:border-primary overflow-hidden h-14 hover:border-primary",
        }}
        labelProps={{
          className:
            "top-[-0.5rem] peer-focus:top-2 peer-focus:text-primary peer-focus:font-semibold left-4 after:border-none",
          ...labelProps,
        }}
        {...passthroughProps}
        {...rest}
      />
    );
  }
);

Input.displayName = "Input";
