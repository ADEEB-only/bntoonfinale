import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// PageTransition is now a simple passthrough - animations are handled in Layout
export function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}
