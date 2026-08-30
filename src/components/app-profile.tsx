import {
  BellIcon,
  BuildingIcon,
  LogOutIcon,
  MessageCircleIcon,
  MoonIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { Organization } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import userTypes from "#/lib/store/user-types";
import { cn, getLabel } from "#/lib/utils";

export default function AppProfile() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, signOut, organization, switchOrganization } = useSession();
  const backend = useBackend();

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  function handleSwitchOrganization(id: string) {
    switchOrganization(id);
  }

  useEffect(() => {
    if (!user) return;
    backend.user
      .getUserOrganizations()
      .then((organizations) => {
        setOrganizations(organizations);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }, [user, organization]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <ImageWrapper src={user?.imageUrl} avatar />
          <AvatarFallback>X</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={"mt-4 w-60"} side={"left"} sideOffset={8}>
        <DropdownMenuLabel className={"p-0"}>
          <div className={"flex items-center gap-2 p-2 text-sm"}>
            <Avatar className={"size-8"}>
              <ImageWrapper src={user?.imageUrl ?? undefined} alt={"Profile"} avatar />
              <AvatarFallback className={"rounded-lg"}>X</AvatarFallback>
            </Avatar>
            <div className={"grid flex-1"}>
              <div>{user ? `${user?.firstName} ${user?.lastName}` : "Guest User"}</div>
              <div className={"text-muted-foreground text-xs"}>{getLabel(userTypes, user?.type)}</div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        {user && (
          <>
            <DropdownMenuGroup>
              {organizations.length > 0 && (
                <>
                  {organization && (
                    <>
                      <DropdownMenuLabel className={"p-0"}>
                        <div className={"flex items-center gap-2 p-2 text-sm"}>
                          <Avatar className={"size-8"}>
                            <ImageWrapper src={organization.imageUrl} avatar />
                            <AvatarFallback className={"rounded-lg"}>X</AvatarFallback>
                          </Avatar>
                          <div className={"grid flex-1"}>
                            <div>{organization.name}</div>
                            <div className={"text-muted-foreground text-xs"}>Current Organization</div>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      className={cn(organization?.id === org.id && "bg-primary text-primary-foreground")}
                      onClick={() => handleSwitchOrganization(org.id)}
                    >
                      <BuildingIcon />
                      <span>{org.name}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/users/${user?.id}`}>
                  <UserIcon />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/messages"}>
                  <MessageCircleIcon />
                  <span>My Messages</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/manage/orders"}>
                  <ShoppingCartIcon />
                  <span>My Orders</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/manage/notifications"}>
                  <BellIcon />
                  <span>My Notifications</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={"/about"}>
              <UsersIcon />
              <span>About Us</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}>
            {resolvedTheme === "light" ? <MoonIcon /> : <SunIcon />}
            <span>{resolvedTheme === "light" ? "Toggle Dark Mode" : "Toggle Light Mode"}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user ? (
            <>
              <DropdownMenuItem asChild>
                <Link href={"/manage"}>
                  <SettingsIcon />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOutIcon />
                <span>Logout</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem asChild>
              <Link href={"/auth"}>
                <LogOutIcon />
                <span>Login</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
