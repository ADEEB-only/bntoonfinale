import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="BnToon Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-display text-base font-bold text-foreground">
              BnToon
            </span>
          </Link>
          
          <div className="flex items-center gap-6 text-xs">
            <Link 
              to="/dmca" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              DMCA
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-muted-foreground">
              © {new Date().getFullYear()} BnToon
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
