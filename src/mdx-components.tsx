import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => <article className={"prose dark:prose-invert"}>{children}</article>,
    ...components,
  };
}
