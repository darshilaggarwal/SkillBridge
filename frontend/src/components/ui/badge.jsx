import React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-muted-foreground",
        emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300",
        violet: "border-indigo-400/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
        slate: "border-zinc-400/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
        warning: "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };

