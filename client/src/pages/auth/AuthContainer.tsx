import React from "react";
import authPic from "../../assets/images/auth-pic.jpg";
import { Logo } from "../../components";
import { useBreakpoint } from "../../hooks";

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children }) => {
  const isMobile = useBreakpoint("sm");

  return (
    <div className="flex flex-col pb-12 md:h-screen md:overflow-hidden bg-white md:grid md:grid-cols-5 md:pb-0">
      <div className="px-4 pt-12 pb-10 mb-14 bg-primary md:bg-transparent md:absolute md:top-6 md:left-6 md:p-0 md:mb-0">
        <Logo
          iconSize={isMobile ? "2xl" : "lg"}
          textClassName={isMobile ? "text-2xl text-white" : ""}
          iconClassName={isMobile ? "text-white pr-1" : ""}
        />
      </div>

      <div className="flex items-center justify-center p-6 pt-0 md:pt-6 md:p-10 md:overflow-y-auto md:h-screen md:col-span-3">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <div className="hidden md:block md:col-span-2">
        <img
          src={authPic}
          alt="Auth illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export { AuthContainer };
