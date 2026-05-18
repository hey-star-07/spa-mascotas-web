import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, className, action }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="rounded-full border-3 border-foreground bg-primary/30 p-6 mb-4">
        {icon || <Inbox className="h-12 w-12 text-foreground" strokeWidth={3} />}
      </div>
      <h3 className="text-xl font-extrabold mb-2">{title}</h3>
      {description && (
        <p className="text-base text-foreground/70 mb-4 text-center max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}