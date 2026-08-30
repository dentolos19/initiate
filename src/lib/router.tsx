import {
  Link as TanStackLink,
  useLocation,
  useNavigate,
  useParams as useTanStackParams,
  useRouter as useTanStackRouter,
} from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";
import { createContext, useContext } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  passHref?: boolean;
};

export const LegacyRouteContext = createContext<Record<string, string>>({});

export default function Link({ href, passHref: _passHref, ...props }: LinkProps) {
  return <TanStackLink {...props} to={href as never} />;
}

export function useRouter() {
  const navigate = useNavigate();
  const router = useTanStackRouter();

  function navigateTo(to: string, replace = false) {
    const url = new URL(to, window.location.href);
    const search = Object.fromEntries(url.searchParams.entries());

    return navigate({
      replace,
      to: url.pathname as never,
      search: search as never,
      hash: url.hash,
    });
  }

  return {
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    push: (to: string) => navigateTo(to),
    replace: (to: string) => navigateTo(to, true),
    refresh: () => router.invalidate(),
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string>>() {
  const compatibilityParams = useContext(LegacyRouteContext);
  const routerParams = useTanStackParams({ strict: false });
  return { ...routerParams, ...compatibilityParams } as T;
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  return new URLSearchParams(useLocation().search);
}
