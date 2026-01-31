import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { SearchModal } from "@/components/search/SearchModal";
import logo from "@/assets/logo.png";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const secretSequence = useRef<string[]>([]);

  const isActive = (path: string) => location.pathname === path;

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search shortcut: Cmd/Ctrl + K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Secret admin access: Type "admin" quickly (within 2 seconds)
      const key = e.key.toLowerCase();
      if (key.length === 1 && /[a-z]/.test(key)) {
        secretSequence.current.push(key);
        
        // Keep only the last 5 characters
        if (secretSequence.current.length > 5) {
          secretSequence.current = secretSequence.current.slice(-5);
        }
        
        // Check if "admin" was typed
        if (secretSequence.current.join("") === "admin") {
          navigate("/admin");
          secretSequence.current = [];
        }
        
        // Reset sequence after 2 seconds of no typing
        setTimeout(() => {
          secretSequence.current = [];
        }, 2000);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img 
                src={logo} 
                alt="BnToon Logo" 
                className="h-9 w-auto object-contain"
              />
              <span className="font-display text-lg font-bold text-foreground">
                BnToon
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm"
                >
                  Home
                </Button>
              </Link>
              <Link to="/browse">
                <Button
                  variant={isActive("/browse") ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm"
                >
                  Comics
                </Button>
              </Link>
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 w-48 lg:w-64 px-3 rounded-lg bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search...</span>
            </button>
            
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border animate-fade-in">
              <div className="flex flex-col gap-1">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive("/") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                  >
                    Home
                  </Button>
                </Link>
                <Link to="/browse" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive("/browse") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                  >
                    Comics
                  </Button>
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
