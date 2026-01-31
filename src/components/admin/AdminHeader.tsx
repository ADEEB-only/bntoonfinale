import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Home, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminHeaderProps {
  userEmail?: string;
  onSignOut: () => void;
}

export function AdminHeader({ userEmail, onSignOut }: AdminHeaderProps) {
  const isMobile = useIsMobile();

  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <>
      <Link to="/" onClick={onClose}>
        <Button variant="ghost" size="sm" className="w-full justify-start sm:w-auto">
          <Home className="h-4 w-4 mr-2 sm:mr-1" />
          View Site
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => {
          onSignOut();
          onClose?.();
        }}
        className="w-full justify-start sm:w-auto"
      >
        <LogOut className="h-4 w-4 mr-2 sm:mr-1" />
        Sign Out
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <span className="font-display text-base sm:text-lg font-bold text-foreground">
                BnToon Admin
              </span>
              {userEmail && (
                <p className="text-xs text-muted-foreground hidden sm:block">{userEmail}</p>
              )}
            </div>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-4">
                  {userEmail && (
                    <p className="text-sm text-muted-foreground px-2 mb-2">{userEmail}</p>
                  )}
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center gap-2">
              <NavLinks />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
