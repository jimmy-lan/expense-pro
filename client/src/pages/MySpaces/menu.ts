import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faLayerGroup,
  faUser,
  faUsers,
  faEraser,
} from "@fortawesome/free-solid-svg-icons";
import type { SpacesFilter } from "../../lib/api";

export type MenuKey = SpacesFilter | "deleted";

type MenuItem = {
  type: "item";
  key: MenuKey;
  label: string;
  icon?: IconDefinition;
  pathname?: string;
  params?: Record<string, string | null | undefined>;
};

export const MENU_ITEMS: Array<MenuItem | { type: "divider" }> = [
  { type: "item", key: "all", label: "All Spaces", icon: faLayerGroup },
  { type: "item", key: "created", label: "Created by Me", icon: faUser },
  { type: "item", key: "invited", label: "Shared with Me", icon: faUsers },
  { type: "divider" },
  {
    type: "item",
    key: "deleted",
    label: "Recently Deleted",
    icon: faEraser,
  },
];
