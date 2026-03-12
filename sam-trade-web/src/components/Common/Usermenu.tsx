// src/components/Common/Usermenu.tsx

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/Authcontext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, RefreshCw } from "lucide-react";

interface UserMenuProps {
  onRoleSwitchOpen: () => void;
}

/**
 * Extract username from email
 * Example: "priya.sharma@gmail.com" → "Priya"
 */
const getUsernameFromEmail = (email?: string | null): string => {
  if (!email) return "User";
  const namePart = email.split("@")[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

/**
 * Initials from username
 * Example: "Priya" → "P"
 */
const getInitials = (email?: string | null): string => {
  if (!email) return "U";
  const username = email.split("@")[0];
  return username.charAt(0).toUpperCase();
};

const UserMenu = ({ onRoleSwitchOpen }: UserMenuProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = getUsernameFromEmail(user?.email);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:!bg-gray-300"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white text-xs font-bold">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            {/*   Username only */}
            <p className="text-sm font-semibold text-foreground">
              {displayName}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onRoleSwitchOpen}
          className="cursor-pointer"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Switch Role
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;