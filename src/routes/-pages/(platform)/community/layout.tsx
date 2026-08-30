"use client";

import {
  BookmarkIcon,
  CalendarIcon,
  ClockIcon,
  FlameIcon,
  MessageCircleWarningIcon,
  PanelLeftIcon,
  TagIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import LogoTitle from "#/components/logo-title";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "#/components/ui/sidebar";
import useBackend from "#/lib/backend/client";
import { useStateUrl } from "#/lib/hooks";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { LayoutProps } from "#/types";

function NestedLayout(props: LayoutProps) {
  const session = useSession();
  const backend = useBackend();
  const { toggleSidebar } = useSidebar();
  const [topics, setTopics] = useState<string[]>([]);

  const [currentTopic] = useStateUrl("topic", "");
  const [currentSort] = useStateUrl("sort", "latest");

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topTopics = await backend.community.getTopTopics();
        setTopics(topTopics);
      } catch (error) {
        console.error("Failed to load topics:", error);
      }
    };

    loadTopics();
  }, []);

  return (
    <>
      <Sidebar className={"mt-16 h-[calc(100dvh-)]"} collapsible={"icon"}>
        <SidebarContent>
          <Link className={"h-16 border-b md:hidden"} href={"/"}>
            <LogoTitle className={"mx-auto h-full w-auto"} />
          </Link>
          <SidebarGroup>
            <SidebarGroupLabel>Feeds</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={"Recent"} isActive={!currentTopic && currentSort === "latest"}>
                    <Link href={"/community"}>
                      <ClockIcon />
                      <span>Latest</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={"Trending"}
                    isActive={!currentTopic && currentSort === "trending"}
                  >
                    <Link href={"/community?sort=trending"}>
                      <FlameIcon />
                      <span>Trending</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {session.user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={"Following"}
                      isActive={!currentTopic && currentSort === "following"}
                    >
                      <Link href={"/community?sort=following"}>
                        <BookmarkIcon />
                        <span>Following</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={"Events"} asChild>
                    <Link href={"/community/events"}>
                      <CalendarIcon />
                      <span>Events</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={"Problems"} asChild>
                    <Link href={"/community/problems"}>
                      <MessageCircleWarningIcon />
                      <span>Problems</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Topics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {topics.map((topic) => (
                  <SidebarMenuItem key={topic}>
                    <SidebarMenuButton tooltip={topic} asChild isActive={currentTopic === topic}>
                      <Link href={`/community?topic=${encodeURIComponent(topic)}`}>
                        <TagIcon />
                        <span>{topic}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleSidebar}>
                <PanelLeftIcon />
                <span>Toggle Sidebar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
