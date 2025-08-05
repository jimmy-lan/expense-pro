import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGg } from "@fortawesome/free-brands-svg-icons";
import { twMerge } from "tailwind-merge";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { useNavigate } from "react-router-dom";
import { useBreakpoint } from "../hooks/useBreakpoint";

export type LogoVariant = "icon" | "full";

export interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  iconSize?: SizeProp;
}

const Logo: React.FC<LogoProps> = ({
  variant = "full",
  className,
  iconClassName,
  textClassName,
  iconSize,
}) => {
  const isMobile = useBreakpoint("sm");
  const navigate = useNavigate();
  const handleLogoClick = () => {
    if (!isMobile) {
      navigate("/");
    }
  };

  return (
    <div
      onClick={handleLogoClick}
      className={twMerge(
        "flex items-center justify-center gap-2 cursor-pointer",
        className
      )}
    >
      <FontAwesomeIcon
        icon={faGg}
        className={twMerge("text-primary", iconClassName)}
        size={iconSize || "lg"}
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
