import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B0F19",
          surface: "#111827",
          elevated: "#171E2D",
          border: "#1F2937",
          "border-light": "#374151",
          pink: "#EC4899",
          purple: "#8B5CF6",
          "pink-hover": "#DB2777",
          "purple-hover": "#7C3AED",
          muted: "#6B7280",
          "muted-light": "#9CA3AF",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #EC4899, #8B5CF6)",
        "gradient-brand-hover": "linear-gradient(135deg, #DB2777, #7C3AED)",
        "gradient-surface": "linear-gradient(135deg, #171E2D, #111827)",
        "gradient-message-out": "linear-gradient(135deg, #EC4899, #8B5CF6)",
        "gradient-message-out-hover": "linear-gradient(135deg, #DB2777, #7C3AED)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-dot": "bounceDot 1.4s infinite ease-in-out",
        "pulse-slow": "pulse 3s infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "scale(0)", opacity: "0.5" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
