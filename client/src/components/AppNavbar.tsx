import React from "react";
import {
  Typography,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
} from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { Logo } from "./Logo";
import { useUserInfo } from "../hooks";

function getUserName(user: Record<string, any> | null): string {
  if (!user) return "";
  const first = user.first_name || user.firstName || "";
  const last = user.last_name || user.lastName || "";
  return `${`${first} ${last}`.trim()}`;
}

export const AppNavbar: React.FC = () => {
  const { user } = useUserInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const name = getUserName(user);
  const email = (user as any)?.email || "";
  const avatarUrl = (user as any)?.avatarUrl as string | undefined;

  const goToLogoutConfirm = () => {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    navigate("/logout/confirm", { state: { returnTo } });
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex items-center gap-4 px-4 py-3 md:px-6">
        <Logo className="justify-start" />
        <div className="ml-auto flex items-center gap-2">
          <Menu placement="bottom-end">
            <MenuHandler>
              <Avatar
                variant="circular"
                size="sm"
                alt="User avatar"
                className="cursor-pointer"
                src={avatarUrl}
              />
            </MenuHandler>
            <MenuList className="p-2">
              <div className="px-3 py-2">
                <Typography
                  variant="small"
                  className="block font-semibold text-gray-900"
                >
                  {name || "User"}
                </Typography>
                {email && (
                  <Typography variant="small" className="text-gray-600">
                    {email}
                  </Typography>
                )}
              </div>
              <div className="my-2 h-px bg-gray-200" />
              <MenuItem
                onClick={goToProfile}
                className="flex items-center gap-3"
              >
                <FontAwesomeIcon icon={faUser} />
                <span>Profile</span>
              </MenuItem>
              <MenuItem
                onClick={goToLogoutConfirm}
                className="flex items-center gap-3"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                <span>Sign out</span>
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
      </div>
    </div>
  );
};
