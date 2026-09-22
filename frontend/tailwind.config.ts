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
        bg:        "#0A0A0C",
        surface:   "#14151A",
        surface2:  "#1C1E24",
        amber:     { DEFAULT: "#D9A441", dim: "#8A6B2E" },
        cyan:      { fx: "#4FD1E8" },
        red:       { fx: "#E5484D" },
        green:     { fx: "#3DD68C" },
        yellow:    { fx: "#E8C547" },
        text:      { primary: "#F2F1ED", muted: "#8B8D96" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "Fira Code", "monospace"],
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
}
export default config
