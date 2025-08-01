import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGg } from "@fortawesome/free-brands-svg-icons";
import { twMerge } from "tailwind-merge";

export type LogoVariant = "icon" | "full";

export interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = "full",
  className,
  iconClassName,
  textClassName,
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <FontAwesomeIcon
        icon={faGg}
        className={twMerge("text-primary", iconClassName)}
        size="lg"
      />
      {variant === "full" && (
        <span
          className={twMerge(
            "font-semibold tracking-tight text-lg md:text-xl text-primary",
            textClassName
          )}
        >
          Expense Pro
        </span>
      )}
    </div>
  );
};

export { Logo };
