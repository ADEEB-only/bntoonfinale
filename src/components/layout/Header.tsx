import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { SearchModal } from "@/components/search/SearchModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TelegramLogin, TelegramUser } from "@/components/comments/TelegramLogin";
import logo from "@/assets/logo.png";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  

  const isActive = (path: string) => location.pathname === path;

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem("tg_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("tg_user");
      }
    }
  }, []);

  const handleAuth = useCallback((authUser: TelegramUser) => {
    setUser(authUser);
    setLoginOpen(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tg_user");
    document.cookie = "tg_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setUser(null);
  };

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search shortcut: Cmd/Ctrl + K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
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

            {/* Login/Logout Button */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {user.telegram_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground max-w-24 truncate">
                    {user.telegram_name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoginOpen(true)}
                className="hidden sm:flex gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}

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
                
                {/* Mobile Login/Logout */}
                {user ? (
                  <div className="flex items-center justify-between px-3 py-2 mt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.telegram_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{user.telegram_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 mt-2"
                    size="sm"
                    onClick={() => {
                      setLoginOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogIn className="h-4 w-4" />
                    Login with Telegram
                  </Button>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login to BnToon</DialogTitle>
            <DialogDescription>
              Connect your Telegram account to comment on comics and chapters.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <TelegramLogin botName="BnToonAccBot" onAuth={handleAuth} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
