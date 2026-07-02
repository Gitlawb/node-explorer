import * as React from "react"

// ShadCN Input Group pattern — https://ui.shadcn.com/docs/components/radix/input-group
// DOM order: InputGroupInput first, then InputGroupAddon (use align prop for visual position).
// Focus state is managed via CSS :focus-within on the InputGroup container.

type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end"

export function InputGroup({
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={`relative flex items-center w-full rounded-xl border border-border bg-surface transition-all duration-150 hover:border-[var(--color-text-dim)] focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 ${className}`}
      {...props}
    />
  )
}

export function InputGroupInput({
  className = "",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input-group-control"
      className={`w-full h-[52px] bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none pr-5 ${className}`}
      {...props}
    />
  )
}

export function InputGroupAddon({
  align = "inline-start",
  className = "",
  ...props
}: React.ComponentProps<"div"> & { align?: InputGroupAddonAlign }) {
  const positionClass =
    align === "inline-start"
      ? "left-0 inset-y-0 pl-4"
      : align === "inline-end"
      ? "right-0 inset-y-0 pr-4"
      : align === "block-start"
      ? "top-0 inset-x-0 pt-3"
      : "bottom-0 inset-x-0 pb-3"

  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={`absolute flex items-center justify-center pointer-events-none ${positionClass} ${className}`}
      {...props}
    />
  )
}
