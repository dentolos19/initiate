import { notFound, useLocation } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

import { LegacyRouteContext } from "#/lib/router";
import CommunityLayout from "#/routes/-pages/(platform)/community/layout";
import PlatformLayout from "#/routes/-pages/(platform)/layout";
import ManageLayout from "#/routes/-pages/(platform)/manage/layout";
import OrganizationManageLayout from "#/routes/-pages/(platform)/manage/organization/layout";
import PlatformManageLayout from "#/routes/-pages/(platform)/manage/platform/layout";
import MessagesLayout from "#/routes/-pages/(platform)/messages/layout";
import StandaloneLayout from "#/routes/-pages/(standalone)/layout";
import Loading from "#/routes/-pages/loading";

type PageModule = { default: ComponentType };
type PageDefinition = {
  component: ComponentType;
  segments: string[];
  source: string;
};

const pageModules = import.meta.glob<PageModule>("../routes/-pages/**/page.tsx");

function routeSegments(source: string) {
  return source
    .replace("../routes/-pages/", "")
    .replace(/\/page\.tsx$/, "")
    .split("/")
    .filter((segment) => !/^\(.+\)$/.test(segment));
}

const pages: PageDefinition[] = Object.entries(pageModules)
  .map(([source, load]) => ({
    component: lazy(load),
    segments: routeSegments(source),
    source,
  }))
  .toSorted((left, right) => {
    const depth = right.segments.length - left.segments.length;
    if (depth) return depth;
    const leftDynamic = left.segments.filter((segment) => /^\[.+]$/.test(segment)).length;
    const rightDynamic = right.segments.filter((segment) => /^\[.+]$/.test(segment)).length;
    return leftDynamic - rightDynamic;
  });

function matchPage(pathname: string) {
  const pathSegments = pathname.split("/").filter(Boolean);

  for (const page of pages) {
    if (page.segments.length !== pathSegments.length) continue;
    const params: Record<string, string> = {};
    const matches = page.segments.every((segment, index) => {
      const dynamic = segment.match(/^\[(.+)]$/);
      if (dynamic) {
        params[dynamic[1]] = decodeURIComponent(pathSegments[index]);
        return true;
      }
      return segment === pathSegments[index];
    });
    if (matches) return { page, params };
  }

  return undefined;
}

function wrap(source: string, page: ReactNode) {
  let content = page;
  if (source.includes("/(platform)/community/")) content = <CommunityLayout>{content}</CommunityLayout>;
  if (source.includes("/(platform)/messages/")) content = <MessagesLayout>{content}</MessagesLayout>;
  if (source.includes("/(platform)/manage/organization/")) {
    content = <OrganizationManageLayout>{content}</OrganizationManageLayout>;
  }
  if (source.includes("/(platform)/manage/platform/")) content = <PlatformManageLayout>{content}</PlatformManageLayout>;
  if (source.includes("/(platform)/manage/")) content = <ManageLayout>{content}</ManageLayout>;
  if (source.includes("/(platform)/")) content = <PlatformLayout>{content}</PlatformLayout>;
  if (source.includes("/(standalone)/")) content = <StandaloneLayout>{content}</StandaloneLayout>;
  return content;
}

export default function LegacyRoute() {
  const match = matchPage(useLocation().pathname);
  if (!match) throw notFound();
  const Page = match.page.component;

  return (
    <LegacyRouteContext.Provider value={match.params}>
      <Suspense fallback={<Loading />}>{wrap(match.page.source, <Page />)}</Suspense>
    </LegacyRouteContext.Provider>
  );
}
