import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-soft hover:-translate-y-0.5 hover:bg-foreground/90",
        secondary:
          "border border-border/70 bg-background/70 text-foreground backdrop-blur-xl hover:-translate-y-0.5 hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        emerald:
          "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:bg-emerald-400",
        violet:
          "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:bg-indigo-400",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
