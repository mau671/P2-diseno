import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  viewportClassName?: string;
};

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, viewportClassName, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div className={cn("h-full w-full overflow-auto", viewportClassName)}>
          {children}
        </div>
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

// Compat por si algún lado lo importa
function ScrollBar() {
  return null;
}

export { ScrollArea, ScrollBar };
