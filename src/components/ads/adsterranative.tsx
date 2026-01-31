import { useEffect } from "react";

export const adsterranative = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://pl28562322.effectivegatecpm.com/c35c6f6f42ee902bbfca715ccd1d497f/invoke.js";

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      id="container-c35c6f6f42ee902bbfca715ccd1d497f"
      className="my-6"
    />
  );
};

