"use client";

import {
  AppWindowIcon,
  BarChart3Icon,
  BellIcon,
  BookmarkIcon,
  BuildingIcon,
  ChevronRightIcon,
  CoinsIcon,
  CommandIcon,
  LayoutDashboardIcon,
  MailIcon,
  PanelLeftIcon,
  PlusIcon,
  ScrollTextIcon,
  ShoppingCartIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "#/components/ui/sidebar";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { Organization } from "#/lib/backend/schema";
import { useIsMobile } from "#/lib/hooks/use-mobile";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { usePathname } from "#/lib/router";
import { cn } from "#/lib/utils";
import Loading from "#/routes/-pages/loading";
import { LayoutProps } from "#/types";

const userLinks = [
  {
    icon: UserIcon,
    name: "My Profile",
    url: "/manage",
  },
  {
    icon: BellIcon,
    name: "My Notifications",
    url: "/manage/notifications",
  },
  {
    icon: BookmarkIcon,
    name: "My Bookmarks",
    url: "/manage/bookmarks",
  },
  {
    icon: ShoppingCartIcon,
    name: "My Orders",
    url: "/manage/orders",
  },
  {
    icon: CoinsIcon,
    name: "My Invoices",
    url: "/manage/invoices",
  },
];

const organizationLinks = [
  {
    icon: BuildingIcon,
    name: "Manage Organization",
    url: "/manage/organization",
  },
  {
    icon: BarChart3Icon,
    name: "Transaction Analytics",
    url: "/manage/organization/analytics",
  },
  {
    icon: UsersIcon,
    name: "Manage Members",
    url: "/manage/organization/members",
  },
  {
    icon: AppWindowIcon,
    name: "Manage Services",
    url: "/manage/organization/services",
  },
  {
    icon: ShoppingCartIcon,
    name: "Manage Orders",
    url: "/manage/organization/orders",
  },
];

const platformLinks = [
  {
    icon: LayoutDashboardIcon,
    name: "Platform Analytics",
    url: "/manage/platform",
  },
  {
    icon: ScrollTextIcon,
    name: "Manage Resources",
    url: "/manage/platform/resources",
  },
  {
    icon: MailIcon,
    name: "Email Preferences",
    url: "/manage/platform/email",
  },
  {
    icon: CommandIcon,
    name: "Developer Controls",
    url: "/manage/platform/development",
  },
];

function NestedLayout(props: LayoutProps) {
  const backend = useBackend();
  const session = useSession();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const isMobile = useIsMobile();

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  function switchOrganization(id: string) {
    session.switchOrganization(id);
  }

  useEffect(() => {
    if (!session.user) return;
    backend.user
      .getUserOrganizations()
      .then((organizations) => {
        setOrganizations(organizations);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }, [session.user, session.organization]);

  if (session.loading) {
    return <Loading />;
  }

  return (
    <>
      <Sidebar className={"mt-16 h-[calc(100dvh-)]"} collapsible={"icon"}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleSidebar}>
                <PanelLeftIcon />
                <span>Toggle Sidebar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userLinks.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton tooltip={item.name} isActive={pathname === item.url} asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {session.organization && (
            <SidebarGroup>
              <SidebarGroupLabel>Organization</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {organizationLinks.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton tooltip={item.name} isActive={pathname === item.url} asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {session.user?.type === "admin" && (
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformLinks.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton tooltip={item.name} isActive={pathname === item.url} asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {session.organization ? (
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size={"lg"}>
                      <Avatar className={"size-8 rounded-md"}>
                        <ImageWrapper src={session.organization?.imageUrl} avatar />
                        <AvatarFallback>X</AvatarFallback>
                      </Avatar>
                      <div className={"font-medium"}>{session.organization?.name}</div>
                      <ChevronRightIcon className={"ml-auto size-4"} />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={"w-50"}
                    side={isMobile ? "top" : "right"}
                    align={isMobile ? "start" : "end"}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href={"/manage/organization/new"}>
                          <PlusIcon />
                          <span>New Organization</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {organizations.map((organization) => (
                        <DropdownMenuItem
                          key={organization.id}
                          className={cn(
                            session.organization?.id === organization.id && "bg-primary text-primary-foreground",
                          )}
                          onClick={() => switchOrganization(organization.id)}
                        >
                          {organization.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"/manage/organization/new"}>
                    <BuildingIcon />
                    <span>Create Organization</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className={"flex flex-1 flex-col"}>
        <button className={"bg-sidebar border-b py-1 text-center md:hidden"} onClick={toggleSidebar}>
          Toggle Sidebar
        </button>
        {props.children}
      </div>
    </>
  );
}

export default function Layout(props: LayoutProps) {
  return (
    <SidebarProvider className={"size-full min-h-0"}>
      <NestedLayout {...props} />
    </SidebarProvider>
  );
}
