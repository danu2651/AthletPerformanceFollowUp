/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a", // Deep elite black
        foreground: "#ededed",
        primary: {
          DEFAULT: "#84cc16", // Your signature Olive/Lime
          glow: "rgba(132, 204, 22, 0.4)",
        },
        card: "rgba(255, 255, 255, 0.03)", // Glassmorphism base
      },
      boxShadow: {
        glow: "0 0 20px rgba(132, 204, 22, 0.2)",
        "glow-strong": "0 0 40px rgba(132, 204, 22, 0.4)",
      },
    },
  },
  plugins: [],
};
