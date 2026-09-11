import "#/components/ui/custom/rich/rich.styles.css";

import { ComponentProps } from "react";

export function RichViewer(props: ComponentProps<"article"> & { content: string }) {
  return (
    <article
      className={"prose prose-sm dark:prose-invert max-w-none"}
      dangerouslySetInnerHTML={{ __html: props.content }}
    />
  );
}
