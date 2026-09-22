import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TIGER ATTACK — Fraud Investigation Command Center",
  description: "Trace the evidence. Follow the connection. Make the next move.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
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
