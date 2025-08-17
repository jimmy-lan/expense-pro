import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  Typography,
} from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { SpacesMenuList } from "./SpacesMenuList";
import type { MenuKey } from "./menu";

export const MySpacesHeader: React.FC<{
  title: string;
  headerAction?: React.ReactNode;
  selected: MenuKey;
  onSelect?: (k: MenuKey) => void;
}> = ({ title, headerAction, selected, onSelect }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex justify-start md:justify-between flex-col md:flex-row">
      <div className="mb-4 mt-2">
        <div className="flex items-center gap-2">
          <Typography variant="h4" className="font-bold text-gray-900">
            {title}
          </Typography>
          <Menu open={isMobileMenuOpen} handler={setIsMobileMenuOpen}>
            <MenuHandler>
              <IconButton
                className="md:hidden rounded-full bg-gray-100 text-gray-900 shadow-none hover:bg-gray-200"
                aria-label="Change view"
              >
                <FontAwesomeIcon
                  icon={faChevronDown}
                  rotation={isMobileMenuOpen ? 180 : undefined}
                  className="transition-transform duration-300"
                />
              </IconButton>
            </MenuHandler>
            <MenuList className="p-2">
              <div className="min-w-[240px]">
                <SpacesMenuList
                  selected={selected}
                  onSelect={onSelect}
                  onItemSelected={() => setIsMobileMenuOpen(false)}
                  className="border-0 shadow-none p-0"
                />
              </div>
            </MenuList>
          </Menu>
        </div>
        <Typography variant="small" className="mt-1 text-gray-600">
          Manage and review your expense spaces
        </Typography>
      </div>
      <div className="mb-4 flex md:items-center md:justify-center">
        {headerAction}
      </div>
    </div>
  );
};
