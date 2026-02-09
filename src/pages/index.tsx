import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useSeriesWithLatestChapters, useFeaturedSeries } from "@/hooks/useSeriesWithLatestChapters";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { LatestUpdateCard } from "@/components/home/LatestUpdateCard";
import { PopularSidebar } from "@/components/home/PopularSidebar";
import { JoinUsCard } from "@/components/home/JoinUsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { MiniBannerAd, SidebarAd } from "@/components/ads/AdBanner";

const Index = () => {
  const { data: featuredData, isLoading: isFeaturedLoading } = useFeaturedSeries();
  const { data: latestSeriesData, isLoading: isLatestLoading } = useSeriesWithLatestChapters(12);
  const featuredSeries = featuredData || [];
  const latestSeries = latestSeriesData || [];

  useEffect(() => {
  const container = document.getElementById(
    "container-c35c6f6f42ee902bbfca715ccd1d497f"
  );

  if (!container || container.hasChildNodes()) return;

  const script = document.createElement("script");
  script.src =
    "https://pl28562322.effectivegatecpm.com/c35c6f6f42ee902bbfca715ccd1d497f/invoke.js";
  script.async = true;
  script.setAttribute("data-cfasync", "false");

  container.appendChild(script);
}, []);


  
  useEffect(() => {
  if (document.getElementById("adsterra-pop")) return;

  const script = document.createElement("script");
  script.id = "adsterra-pop";
  script.src =
    "https://pl28562281.effectivegatecpm.com/c1/b5/46/c1b546b49059ac9e88a2480f34e6bc7a.js";

  document.body.appendChild(script);
}, []);


  return (
    <Layout>
      <div className="min-h-screen">
        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Column - Featured + Latest Updates */}
            <div className="lg:col-span-3">
              {/* Featured Section */}
              {isFeaturedLoading ? (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Skeleton className="w-full sm:w-32 aspect-[3/4] rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16 rounded" />
                          <Skeleton className="h-5 w-16 rounded" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-8 w-24 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : featuredSeries.length > 0 ? (
                <FeaturedSection series={featuredSeries} />
              ) : null}

              {/* Ad Container */}
              <div className="mb-6 flex justify-center">
                <MiniBannerAd />
              </div>

              {/* Latest Updates Section */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <h2 className="font-display text-xl font-bold text-foreground">Latest Updates</h2>
                  </div>
                  <Link 
                    to="/browse" 
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group"
                  >
                    VIEW ALL 
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                
                {isLatestLoading ? (
                  <div className="bg-card rounded-xl border border-border divide-y divide-border">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-4 flex gap-4">
                        <Skeleton className="w-[80px] aspect-[3/4] rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : latestSeries.length > 0 ? (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 divide-border">
                      {latestSeries.map((s, index) => (
                        <div
                          key={s.id}
                          className={`border-border ${
                            index < latestSeries.length - 2 ? "md:border-b" : ""
                          } ${index % 2 === 0 ? "md:border-r" : ""} ${
                            index !== latestSeries.length - 1 ? "border-b md:border-b-0" : ""
                          } ${Math.floor(index / 2) < Math.floor((latestSeries.length - 1) / 2) ? "md:border-b" : ""}`}
                        >
                          <LatestUpdateCard
                            id={s.id}
                            title={s.title}
                            coverUrl={s.cover_url}
                            status={s.status}
                            type={s.type}
                            chapters={s.chapters}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-16 text-center">
                    <p className="text-muted-foreground">No series available yet.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <PopularSidebar />
              <div className="flex justify-center">
                <SidebarAd />
              </div>
              <JoinUsCard />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
