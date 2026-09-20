import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "TIGER EFFECT — Fraud Investigation Intelligence",
  description: "Hunt the evidence. Map the fraud.",
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="scanlines min-h-screen bg-[#080A0C] text-slate-100 antialiased">
        <div className="scan-line" />
        {children}
      </body>
    </html>
  )
}
