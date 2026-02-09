import { useEffect, useRef, useState } from "react";

interface AdBannerProps {
  width: number;
  height: number;
  className: string;
  domain: string;
  affQuery: string;
  placementName: string;
}

let adInstanceCounter = 0;

export function AdBanner({ width, height, className, domain, affQuery, placementName }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [instanceId] = useState(() => ++adInstanceCounter);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = "";

    // Create the ins element
    const ins = document.createElement("ins");
    ins.style.width = width === 0 ? "0px" : `${width}px`;
    ins.style.height = height === 0 ? "0px" : `${height}px`;
    ins.style.display = "inline-block";
    ins.setAttribute("data-width", String(width));
    ins.setAttribute("data-height", String(height));
    ins.className = className;
    ins.setAttribute("data-domain", domain);
    ins.setAttribute("data-affquery", affQuery);

    container.appendChild(ins);

    // Create and append the script with a cache-buster to force re-execution
    const script = document.createElement("script");
    script.src = `${domain}/js/responsive.js?t=${Date.now()}-${instanceId}`;
    script.async = true;

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [width, height, className, domain, affQuery, placementName, instanceId]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center overflow-hidden max-w-full"
      data-placement={placementName}
    />
  );
}

// Pre-configured ad components
export function MiniBannerAd() {
  return (
    <AdBanner
      width={468}
      height={60}
      className="jf93c9f9f58"
      domain="//data527.click"
      affQuery="/16a22f324d5687c1f7a4/f93c9f9f58/?placementName=MiniBanner"
      placementName="MiniBanner"
    />
  );
}

export function LargeBannerAd() {
  return (
    <AdBanner
      width={728}
      height={90}
      className="sfb45f70481"
      domain="//data527.click"
      affQuery="/a4127c19028b6c01ba5c/fb45f70481/?placementName=LargeBanner"
      placementName="LargeBanner"
    />
  );
}

export function SidebarAd() {
  return (
    <AdBanner
      width={300}
      height={250}
      className="m5afd89751f"
      domain="//data527.click"
      affQuery="/5fbf3d48481d384a64a7/5afd89751f/?placementName=LargeBanner"
      placementName="SidebarAd"
    />
  );
}
