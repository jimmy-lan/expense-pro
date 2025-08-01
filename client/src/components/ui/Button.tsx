import React from "react";
import { Button as MTButton } from "@material-tailwind/react";
import { twMerge } from "tailwind-merge";

type NativeMTButtonProps = React.ComponentPropsWithoutRef<typeof MTButton>;
type NativeMTButtonRef = React.ElementRef<typeof MTButton>;

// Extend color to accept our brand colors without passing them to MT directly
export type AppButtonProps = Omit<NativeMTButtonProps, "color" | "size"> & {
  color?: NativeMTButtonProps["color"] | "primary" | "secondary";
  size?: NativeMTButtonProps["size"];
};

function brandClasses(
  variant: NativeMTButtonProps["variant"],
  color: "primary" | "secondary"
) {
  const isPrimary = color === "primary";
  const base = {
    filled: isPrimary
      ? "bg-primary text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/40 focus:ring-4 focus:ring-primary/20"
      : "bg-secondary text-white shadow-md shadow-secondary/20 hover:shadow-lg hover:shadow-secondary/40 focus:ring-4 focus:ring-secondary/20",
    outlined: isPrimary
      ? "border border-primary text-primary hover:bg-primary/5 focus:ring-4 focus:ring-primary/20"
      : "border border-secondary text-secondary hover:bg-secondary/5 focus:ring-4 focus:ring-secondary/20",
    gradient: isPrimary
      ? "bg-gradient-to-tr from-primary to-primary/80 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/40"
      : "bg-gradient-to-tr from-secondary to-secondary/80 text-white shadow-md shadow-secondary/20 hover:shadow-lg hover:shadow-secondary/40",
    text: isPrimary
      ? "text-primary hover:bg-primary/5 focus:ring-4 focus:ring-primary/20"
      : "text-secondary hover:bg-secondary/5 focus:ring-4 focus:ring-secondary/20",
  } as const;
  return base[variant ?? "filled"];
}

export const Button = React.forwardRef<NativeMTButtonRef, AppButtonProps>(
  (
    { color = "primary", size = "lg", variant = "filled", className, ...rest },
    ref
  ) => {
    const isBrandColor = color === "primary" || color === "secondary";
    const classes = isBrandColor
      ? brandClasses(variant, color as "primary" | "secondary")
      : "";

    // Only pass color prop to MT when it's one of their supported colors
    const passthroughProps: Partial<NativeMTButtonProps> = {};
    if (!isBrandColor && color) {
      passthroughProps.color = color as NativeMTButtonProps["color"];
    }

    return (
      <MTButton
        ref={ref}
        variant={variant}
        size={size}
        className={twMerge(classes, className)}
        {...passthroughProps}
        {...rest}
      />
    );
  }
);
