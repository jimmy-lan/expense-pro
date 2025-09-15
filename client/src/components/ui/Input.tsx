import React, { useState } from "react";
import {
  IconButton,
  Input as MTInput,
  Textarea as MTTextarea,
} from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

type NativeMTInputProps = React.ComponentPropsWithoutRef<typeof MTInput>;
type NativeMTInputRef = React.ElementRef<typeof MTInput>;

type NativeMTTextareaProps = React.ComponentPropsWithoutRef<typeof MTTextarea>;
type NativeMTTextareaRef = React.ElementRef<typeof MTTextarea>;

const BASE_CONTAINER_CLASSES =
  "!border focus-within:!border-2 border-gray-400 rounded-md focus-within:border-primary overflow-hidden hover:border-primary";

const BASE_LABEL_CLASSES = `
  top-[-0.3rem]
  peer-[:not(:placeholder-shown)]:top-2 peer-focus:top-2
  peer-focus:text-primary
  font-semibold left-4
  after:border-none
`;

export type AppInputProps = Omit<
  NativeMTInputProps,
  "color" | "size" | "variant"
> & {
  size?: NativeMTInputProps["size"];
  variant?: NativeMTInputProps["variant"];
  helperText?: string;
  endAdornment?: React.ReactNode | false;
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
      endAdornment,
      ...rest
    },
    ref
  ) => {
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <>
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
                BASE_CONTAINER_CLASSES + " h-16",
                rest.error && "!border-red-500"
              ),
            }}
            labelProps={{
              className: BASE_LABEL_CLASSES,
              ...labelProps,
            }}
            {...rest}
          />
          {isPassword ? (
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
          ) : endAdornment ? (
            <div className="!absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {typeof endAdornment === "boolean" ? null : endAdornment}
            </div>
          ) : null}
        </div>
        {helperText && (
          <p className="!mt-1 text-xs text-red-600">{helperText}</p>
        )}
      </>
    );
  }
);

Input.displayName = "Input";

export type AppTextareaProps = Omit<
  NativeMTTextareaProps,
  "color" | "size" | "variant"
> & {
  size?: NativeMTTextareaProps["size"];
  variant?: NativeMTTextareaProps["variant"];
  helperText?: string;
};

export const TextArea = React.forwardRef<NativeMTTextareaRef, AppTextareaProps>(
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
        <div className="relative">
          <MTTextarea
            ref={ref}
            variant="standard"
            size={size}
            placeholder={placeholder || " "}
            className={twMerge("!px-4 pt-6 !border-none", className)}
            containerProps={{
              className: twMerge(
                BASE_CONTAINER_CLASSES,
                rest.error && "!border-red-500"
              ),
            }}
            labelProps={{
              className: BASE_LABEL_CLASSES,
              ...labelProps,
            }}
            {...rest}
          />
        </div>
        {helperText && (
          <p className="!mt-1 text-xs text-red-600">{helperText}</p>
        )}
      </>
    );
  }
);

TextArea.displayName = "TextArea";
