import React, { useState } from "react";
import { IconButton, Input as MTInput } from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

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
      type,
      ...rest
    },
    ref
  ) => {
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <MTInput
          ref={ref}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          variant="standard"
          size={size}
          placeholder={placeholder || " "}
          className={twMerge("!px-4 !border-none", className)}
          containerProps={{
            className: twMerge(
              "!border focus-within:!border-2 border-gray-400 rounded-md focus-within:border-primary overflow-hidden h-16 hover:border-primary",
              rest.error && "!border-red-500"
            ),
          }}
          labelProps={{
            className:
              "top-[-0.3rem] peer-[:not(:placeholder-shown)]:top-2 peer-focus:top-2 peer-focus:text-primary font-semibold left-4 after:border-none",
            ...labelProps,
          }}
          {...rest}
        />
        {isPassword && (
          <IconButton
            className="!absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 hover:bg-gray-300 text-black/90 shadow-none hover:shadow-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <FontAwesomeIcon icon={faEyeSlash} />
            ) : (
              <FontAwesomeIcon icon={faEye} />
            )}
          </IconButton>
        )}
        {helperText && (
          <p className="!mt-1 text-xs text-red-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
