import React from "react";
import { List, ListItem, ListItemPrefix } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { MENU_ITEMS, type MenuKey } from "./menu";
import { useNavigate, useSearchParams } from "react-router-dom";

export const SpacesMenuList: React.FC<{
  selected: MenuKey;
  onSelect?: (value: MenuKey) => void;
  onItemSelected?: () => void;
  className?: string;
}> = ({ selected, onSelect, onItemSelected, className }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSelect = (key: MenuKey) => {
    const entry = MENU_ITEMS.find(
      (e: any) => e.type === "item" && e.key === key
    ) as any;
    if (entry?.pathname) {
      const url = new URL(entry.pathname, window.location.origin);
      const params = new URLSearchParams();
      Object.entries(entry.params || {}).forEach(([k, v]) => {
        if (v === null || typeof v === "undefined") return;
        params.set(k, String(v));
      });
      const path = `${url.pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      navigate(path);
    } else {
      const params = new URLSearchParams(searchParams);
      if (key === "all") params.delete("tab");
      else params.set("tab", key);
      setSearchParams(params);
    }
    onSelect?.(key);
    onItemSelected?.();
  };

  return (
    <List
      className={twMerge(
        "rounded-xl border border-gray-200 bg-white p-2 shadow-sm",
        className
      )}
    >
      {MENU_ITEMS.map((entry, idx) => {
        if (entry.type === "divider") {
          return (
            <div
              key={`divider-${idx}`}
              className="my-1 border-t border-gray-200"
            />
          );
        }
        const isActive = entry.key === selected;
        return (
          <ListItem
            key={entry.key}
            onClick={() => handleSelect(entry.key)}
            className={twMerge(
              "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-gray-800",
              "transition-all",
              isActive
                ? "bg-secondary/10 hover:bg-secondary/15 focus:bg-secondary/10 shadow-sm before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-secondary"
                : "hover:bg-secondary/5"
            )}
          >
            {entry.icon && (
              <ListItemPrefix>
                <span
                  className={twMerge(
                    "grid h-8 w-8 place-items-center rounded-md",
                    isActive
                      ? "bg-white/2 bg-secondary/5 text-secondary"
                      : "bg-gray-100 text-gray-700 group-hover:bg-secondary/10 group-hover:text-secondary"
                  )}
                >
                  <FontAwesomeIcon icon={entry.icon} />
                </span>
              </ListItemPrefix>
            )}
            <span
              className={twMerge(
                "font-medium",
                isActive ? "text-gray-900" : "text-gray-800"
              )}
            >
              {entry.label}
            </span>
          </ListItem>
        );
      })}
    </List>
  );
};
