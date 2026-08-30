import { BellIcon, MenuIcon, MessageCircleIcon, SearchIcon, ShoppingCartIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { ComponentProps, useEffect, useState } from "react";

import AppProfile from "#/components/app-profile";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "#/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import ImageWrapper from "#/components/ui/wrappers/image";
import { useIsMobile } from "#/lib/hooks/use-mobile";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { usePathname, useRouter, useSearchParams } from "#/lib/router";
import { cn } from "#/lib/utils";

const items = [
  {
    name: "Market",
    url: "/market",
    auth: false,
  },
  {
    name: "Community",
    url: "/community",
    auth: false,
  },
  {
    name: "Resources",
    url: "/resources",
    auth: false,
  },
];

export default function AppNavigation(props: ComponentProps<"nav">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useSession();
  const { resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isMobile = useIsMobile();
  const query = searchParams.get("query") as string;

  function search(query: string) {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("query", query);

    router.push(`/search?${newSearchParams.toString()}`);
  }

  if (isMobile) {
    return (
      <nav className={cn("bg-background/95 flex h-16 items-center gap-3 border-b px-4 shadow-xs", props.className)}>
        {/* Left */}
        <div className={"flex flex-1 items-center justify-start md:hidden"}>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant={"ghost"} size={"icon"} aria-label="Open navigation">
                <MenuIcon className={"size-6"} />
              </Button>
            </SheetTrigger>
            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle>Explore Initiate</SheetTitle>
                <SheetDescription>Find services, community knowledge, and practical resources.</SheetDescription>
              </SheetHeader>
              <div>
                <Button className={"w-full justify-start"} variant={pathname === "/" ? "secondary" : "ghost"} asChild>
                  <Link href={"/"} onClick={() => setMenuOpen(false)}>
                    Home
                  </Link>
                </Button>
                {items.map((item) => (
                  <Button
                    key={item.url}
                    className={"w-full justify-start"}
                    variant={pathname.startsWith(item.url) ? "secondary" : "ghost"}
                    asChild
                  >
                    <Link href={item.url} onClick={() => setMenuOpen(false)}>
                      {item.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center */}
        <div className={"relative flex grow items-center"}>
          <Input
            className={"pl-10"}
            defaultValue={query}
            onKeyUp={(e) => e.key === "Enter" && search((e.target as HTMLInputElement).value)}
            aria-label="Search Initiate"
            placeholder={"Search Initiate"}
          />
          <div className={"text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"}>
            <SearchIcon className={"size-5"} />
          </div>
        </div>

        <div className={"flex flex-1 items-center justify-end"}>
          <AppProfile />
        </div>
      </nav>
    );
  } else {
    return (
      <nav className={cn("bg-background/95 flex h-16 items-center border-b px-5 shadow-xs", props.className)}>
        {/* Left */}
        <div className={"flex min-w-0 flex-1 items-center justify-start gap-5"}>
          <Link href={"/"}>
            <ImageWrapper
              className={"size-10 object-contain"}
              src={mounted && resolvedTheme === "dark" ? "/assets/logo-light.png" : "/assets/logo-dark.png"}
              alt={"Logo"}
            />
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              {items.map((item) => {
                if (item.auth && !user) return null;
                return (
                  <NavigationMenuItem key={item.url}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          pathname.startsWith(item.url) && "bg-accent text-accent-foreground",
                        )}
                      >
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Center */}
        <div className={"relative mx-6 flex max-w-xl grow items-center"}>
          <Input
            className={"pl-10"}
            defaultValue={query}
            onKeyUp={(e) => e.key === "Enter" && search((e.target as HTMLInputElement).value)}
            aria-label="Search Initiate"
            placeholder={"Search services, people, and resources"}
          />
          <div className={"text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"}>
            <SearchIcon className={"size-5"} />
          </div>
        </div>

        {/* Right */}
        <div className={"flex min-w-0 flex-1 items-center justify-end gap-3"}>
          {user && (
            <div className={"flex items-center gap-1"}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"} size={"icon"} asChild>
                    <Link href={"/messages"} aria-label="Messages">
                      <MessageCircleIcon />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>My Messages</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"} size={"icon"} asChild>
                    <Link href={"/manage/orders"} aria-label="Orders">
                      <ShoppingCartIcon />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>My Orders</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={"ghost"} size={"icon"} asChild>
                    <Link href={`/manage/notifications`} aria-label="Notifications">
                      <BellIcon />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>My Notifications</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Avatar */}
          <AppProfile />
        </div>
      </nav>
    );
  }
}
