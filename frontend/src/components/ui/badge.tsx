import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border-3 border-foreground px-3 py-1 text-xs font-bold shadow-cartoon-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-foreground",
        secondary: "bg-secondary text-foreground",
        destructive: "bg-rose text-foreground",
        outline: "bg-white text-foreground",
        accent: "bg-accent text-foreground",
        lavender: "bg-lavender text-foreground",
        info: "bg-info text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };