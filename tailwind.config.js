/** @type {import('tailwindcss').Config} */
export default {
  content: ["./frontend/index.html", "./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        mist: "#f6f7f9",
        panel: "#ffffff",
        line: "#d8dee8",
        graphite: "#52606d",
        sage: "#2f7d5c",
        amber: "#a86403",
        brick: "#b42318",
        steel: "#3f6f9f"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 39, 75, 0.08)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
      },
    },
  },
  plugins: [],
};
