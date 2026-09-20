import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          950: "#1a0e00",
        },
        bg: "#080A0C",
        surface: "#0D1117",
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}
export default config
