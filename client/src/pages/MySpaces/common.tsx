import React from "react";
import { Typography } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Button } from "../../components/ui/Button";

export const EmptySpacesIndicator: React.FC<{
  title: string;
  subtitle?: string;
  onButtonClick?: () => void;
  loading?: boolean;
  icon?: IconDefinition;
  buttonLabel?: string;
}> = ({ title, subtitle, onButtonClick, loading, icon, buttonLabel }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
    {icon && (
      <div className="mb-4">
        <FontAwesomeIcon icon={icon} className="text-secondary text-6xl" />
      </div>
    )}
    <Typography variant="h5" className="font-semibold text-gray-900">
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="small" className="mt-2 text-gray-600">
        {subtitle}
      </Typography>
    )}
    {onButtonClick && (
      <Button
        onClick={onButtonClick}
        disabled={loading}
        className="mt-6"
        variant="outlined"
        color="primary"
        loading={loading}
      >
        {buttonLabel ?? "Refresh"}
      </Button>
    )}
  </div>
);
