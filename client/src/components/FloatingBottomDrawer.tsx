import React from "react";
import { IconButton } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export const FloatingBottomDrawer: React.FC<{
  open: boolean;
  prompt: React.ReactNode;
  onExit: () => void;
  children?: React.ReactNode;
}> = ({ open, prompt, onExit, children }) => {
  return (
    <div
      className={
        "fixed left-0 right-0 bottom-0 transition-transform duration-300 " +
        (open ? "translate-y-0" : "translate-y-full")
      }
    >
      <div className="mx-auto max-w-4xl px-4 pb-6 pt-4 md:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3 pl-2 lg:pl-4">
            <div className="text-sm text-gray-700">{prompt}</div>
            <div className="flex items-center gap-3">
              {children}
              <IconButton
                variant="text"
                color="gray"
                className="rounded-md h-10 w-10"
                aria-label="Exit selection"
                onClick={onExit}
              >
                <FontAwesomeIcon icon={faXmark} />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
