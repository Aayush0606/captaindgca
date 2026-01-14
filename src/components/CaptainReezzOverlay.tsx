import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CaptainReezzOverlayProps {
  className?: string;
}

export function CaptainReezzOverlay({ className }: CaptainReezzOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if overlay has been shown in this session
    const hasBeenShown = sessionStorage.getItem('captainReezzOverlayShown');

    if (hasBeenShown) {
      // If already shown in this session, hide immediately
      setIsVisible(false);
      return;
    }

    // Mark as shown in sessionStorage immediately
    sessionStorage.setItem('captainReezzOverlayShown', 'true');

    // Auto-animate out after 2 seconds
    const timer = setTimeout(() => {
      setIsAnimating(true);
      // Remove from DOM after animation completes (0.5s animation)
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* GIF Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="https://giffiles.alphacoders.com/337/33730.gif"
          alt="Aviation background"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Main Content */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center text-center transition-all duration-700 ease-out",
          isAnimating && "opacity-0 translate-y-6 scale-[0.97]"
        )}
      >
        <p className="mb-4 text-[11px] md:text-sm uppercase tracking-[0.45em] text-white/70">
          Welcome Aboard
        </p>

        <div className="leading-none">
          <h1 className="text-4xl md:text-6xl font-medium text-white/90">
            Captain
          </h1>
          <h2 className="mt-1 text-6xl md:text-8xl font-extrabold tracking-tight text-white">
            Reezz
          </h2>
        </div>

        <div className="mt-6 h-[1px] w-48 bg-white/40" />

        <p className="mt-5 text-sm md:text-base text-white/75 tracking-wide">
          Commanding the journey ahead
        </p>
      </div>



    </div>
  );
}
