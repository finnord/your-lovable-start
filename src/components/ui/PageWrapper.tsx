import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent page wrapper with standardized padding and max-width.
 * Use this wrapper on all pages to ensure design consistency.
 * 
 * Standard padding: p-8 (mobile) → p-12 (tablet) → p-16 (desktop)
 * Max width: 6xl (1152px)
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn("p-8 md:p-12 lg:p-16 max-w-6xl space-y-phi-6", className)}>
      {children}
    </div>
  );
}
