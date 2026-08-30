"use client";

import { AvatarImage } from "#/components/ui/avatar";
import clsx from "clsx";
import { type ImgHTMLAttributes, useEffect, useState } from "react";

type ImageWrapperProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
  avatar?: boolean;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function ImageWrapper(props: ImageWrapperProps) {
  const [source, setSource] = useState<string | null | undefined>(props.src);

  useEffect(() => {
    setSource(props.src);
  }, [props.src]);

  if (props.avatar) {
    return <AvatarImage className={props.className} src={source ?? undefined} alt={props.alt} />;
  }

  const { avatar: _avatar, fill, priority, unoptimized: _unoptimized, ...imageProps } = props;

  return (
    <img
      {...imageProps}
      className={clsx("block object-cover", props.className)}
      src={source || "/assets/placeholder.webp"}
      alt={props.alt ?? "Image"}
      width={fill ? undefined : props.width}
      height={fill ? undefined : props.height}
      loading={priority ? "eager" : "lazy"}
      onError={() => setSource(undefined)}
    />
  );
}
