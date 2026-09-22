"use client"

import { motion } from "framer-motion"
import { Activity, Database, GitBranch, ShieldCheck } from "lucide-react"
import { BlurText } from "@/components/react-bits/BlurText"

export function InvestigationLoader({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--ink)] tiger-noise">
      <div className="absolute inset-0 tiger-grid opacity-70" aria-hidden />
      <div className="loader-beams" aria-hidden />
      <div className="loader-radar" aria-hidden />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 text-center">
        <div className="mb-10 flex w-full items-center justify-between forensic text-[9px] tracking-[.18em] text-white/30">
          <span>TIGER ATTACK // SYSTEM LINK</span>
          <span className="status-live">LIVE REQUEST</span>
        </div>

        <div className="relative mb-9 h-48 w-48">
          <motion.div
            className="absolute inset-0 border border-[var(--amber)]/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-5 rounded-full border border-dashed border-[var(--cyan)]/35"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[68px] rounded-full border border-[var(--amber)]/70 bg-[var(--amber)]/10 shadow-[0_0_55px_rgba(246,166,35,.32)]"
            animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 24px rgba(246,166,35,.18)", "0 0 65px rgba(246,166,35,.45)", "0 0 24px rgba(246,166,35,.18)"] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-semibold tracking-[.18em] text-[var(--amber-bright)] text-2xl">TA</span>
          {[{ icon: GitBranch, position: "left-0 top-1/2" }, { icon: Database, position: "right-0 top-1/2" }, { icon: ShieldCheck, position: "left-1/2 bottom-0" }].map(({ icon: Icon, position }, index) => (
            <motion.span key={index} className={`absolute ${position} -translate-x-1/2 translate-y-1/2 border border-white/10 bg-[var(--surface)] p-2 text-[var(--cyan)]`} animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.8, delay: index * 0.25, repeat: Infinity }}>
              <Icon size={13} aria-hidden />
            </motion.span>
          ))}
        </div>

        <div className="eyebrow text-[var(--cyan)]">Fresh investigation</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[var(--text)] md:text-4xl">
          <BlurText text="Tracing the case signal" delay={80} stepDuration={0.42} />
        </h1>
        <div className="mt-5 flex min-h-6 items-center gap-2 forensic text-[11px] tracking-[.18em] text-[var(--amber-bright)]" role="status" aria-live="polite">
          <Activity size={13} className="animate-pulse" aria-hidden />
          {message || "REQUEST SENT"}
        </div>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/40">Waiting for the backend investigation to return a verified result. Verdicts and evidence appear only after the response arrives.</p>

        <div className="mt-9 h-px w-full overflow-hidden bg-white/10" aria-hidden>
          <motion.div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent" animate={{ x: ["-120%", "320%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <div className="mt-3 flex w-full justify-between forensic text-[8px] tracking-[.14em] text-white/25"><span>NO CACHED VERDICT</span><span>RESULT GATE ACTIVE</span></div>
      </div>
    </div>
  )
}
