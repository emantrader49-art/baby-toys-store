/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Soft, trustworthy palette for a baby-toys storefront —
        // muted sage + warm apricot, not the generic SaaS blue/purple.
        cream: "#FBF7F1",
        sage: { 50: "#F1F5EF", 100: "#DEE8D9", 400: "#7FA06E", 600: "#5C7C4F", 700: "#455D3B" },
        apricot: { 100: "#FBE3CE", 400: "#F0A75C", 500: "#E5924A" },
        ink: "#2B2A28",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        soft: "0.85rem",
      },
    },
  },
  plugins: [],
};
