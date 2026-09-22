import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TIGER EFFECT — Fraud Investigation Intelligence",
  description: "Hunt the evidence. Map the fraud.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="bg-[#0A0A0C] text-[#F2F1ED] antialiased"
        suppressHydrationWarning
      >
        {children}
        {/* Tab visibility script — pauses animations when tab is hidden */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function update(){
              document.body.classList.toggle('tab-hidden', document.hidden);
            }
            document.addEventListener('visibilitychange', update);
            update();
          })();
        `}} />
      </body>
    </html>
  )
}
