import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primaire" | "contour" | "discret";
type Size = "md" | "sm";

const BASE =
  "type-ui inline-flex items-center justify-center gap-2.5 rounded-field transition-[background-color,color,border-color,transform] duration-200 ease-atelier active:translate-y-px disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<Variant, string> = {
  primaire: "bg-accent text-on-accent hover:bg-accent-hover",
  contour: "border border-accent text-accent hover:bg-accent hover:text-on-accent",
  discret: "text-fg link-underline hover:text-accent",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-6 py-3",
  sm: "min-h-9 px-4 py-2",
};

/** Le variant `discret` n'a pas de boîte : il ne prend pas les paddings. */
function classes(variant: Variant, size: Size, className?: string) {
  return cn(BASE, VARIANTS[variant], variant === "discret" ? "min-h-11" : SIZES[size], className);
}

export function Button({
  variant = "primaire",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primaire",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={classes(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
