import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/index";
import Browse from "./pages/browse";
import SeriesPage from "./pages/series";
import Reader from "./pages/reader";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import SeriesForm from "./pages/admin/seriesform";
import ChapterManager from "./pages/admin/chaptermanager";
import GenreManager from "./pages/admin/genremanager";
import NotFound from "./pages/notfound";
import DMCA from "./pages/dmca";
import { PageTransition } from "./components/layout/pagetransition";
import AdminRoute from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/browse" element={<PageTransition><Browse /></PageTransition>} />
        <Route path="/series/:id" element={<PageTransition><SeriesPage /></PageTransition>} />
        <Route path="/read/:chapterId" element={<PageTransition><Reader /></PageTransition>} />
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminRoute><AdminDashboard /></AdminRoute></PageTransition>} />
        <Route path="/admin/series/new" element={<PageTransition><AdminRoute><SeriesForm /></AdminRoute></PageTransition>} />
        <Route path="/admin/series/:id/edit" element={<PageTransition><AdminRoute><SeriesForm /></AdminRoute></PageTransition>} />
        <Route path="/admin/series/:seriesId/chapters" element={<PageTransition><AdminRoute><ChapterManager /></AdminRoute></PageTransition>} />
        <Route path="/admin/genres" element={<PageTransition><AdminRoute><GenreManager /></AdminRoute></PageTransition>} />
        <Route path="/dmca" element={<PageTransition><DMCA /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

