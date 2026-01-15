import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("light", stored === "light");
    }
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative group w-14 h-8 rounded-full p-1 transition-all duration-500 ease-out",
        "bg-gradient-to-r overflow-hidden",
        theme === "dark" 
          ? "from-indigo-900 via-purple-900 to-slate-900" 
          : "from-sky-400 via-blue-400 to-cyan-300",
        "shadow-lg hover:shadow-xl",
        theme === "dark" 
          ? "shadow-purple-500/20 hover:shadow-purple-500/40" 
          : "shadow-sky-400/30 hover:shadow-sky-400/50",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Stars for dark mode */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-500",
        theme === "dark" ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute top-1.5 left-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
        <div className="absolute top-3 left-4 w-1 h-1 bg-white/80 rounded-full animate-pulse delay-100" />
        <div className="absolute top-2 right-8 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse delay-200" />
        <div className="absolute bottom-2 left-6 w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse delay-300" />
      </div>

      {/* Clouds for light mode */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-500",
        theme === "light" ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute top-1 left-1 w-3 h-1.5 bg-white/60 rounded-full blur-[1px]" />
        <div className="absolute bottom-1.5 right-6 w-4 h-2 bg-white/50 rounded-full blur-[1px]" />
      </div>

      {/* Toggle knob */}
      <div
        className={cn(
          "relative z-10 w-6 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-center",
          "transform",
          theme === "dark" ? "translate-x-0" : "translate-x-6",
          isAnimating && "scale-90"
        )}
      >
        {/* Glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full transition-all duration-500",
          theme === "dark" 
            ? "bg-gradient-to-br from-slate-300 via-slate-100 to-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.5)]" 
            : "bg-gradient-to-br from-yellow-300 via-amber-200 to-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
        )} />
        
        {/* Icon container with rotation */}
        <div className={cn(
          "relative z-10 transition-transform duration-500",
          isAnimating && "rotate-[360deg]"
        )}>
          {theme === "dark" ? (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-600" />
          )}
        </div>

        {/* Sun rays animation */}
        {theme === "light" && (
          <div className="absolute inset-0 animate-spin-slow">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-1 bg-amber-400/40 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transformOrigin: "center",
                  transform: `rotate(${i * 45}deg) translateY(-12px) translateX(-50%)`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ripple effect on toggle */}
      {isAnimating && (
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-30",
          theme === "dark" ? "bg-slate-400" : "bg-amber-400"
        )} />
      )}
    </button>
  );
}
