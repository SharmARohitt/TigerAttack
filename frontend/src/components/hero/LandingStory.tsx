"use client"

import { motion } from "framer-motion"
import { ArrowDown, BrainCircuit, Database, FileSearch, GitBranch, ShieldCheck, Zap } from "lucide-react"
import { BlurText } from "@/components/react-bits/BlurText"

const toneClasses = {
  amber: "text-[var(--amber-bright)] border-[var(--amber)]/30",
  cyan: "text-[var(--cyan)] border-[var(--cyan)]/25",
  green: "text-[var(--green-fx)] border-[var(--green-fx)]/25",
  red: "text-[var(--red-fx)] border-[var(--red-fx)]/25",
}

type Tone = keyof typeof toneClasses

const chapters: Array<{ index: string; label: string; title: string; detail: string; icon: typeof Zap; tone: Tone }> = [
  { index: "01", label: "THE TRIGGER", title: "Start with the signal.", detail: "A flagged transaction becomes a traceable investigation, not an isolated score.", icon: Zap, tone: "amber" },
  { index: "02", label: "THE GRAPH", title: "Follow the connection.", detail: "Transactions, identities, devices, cards, and prior cases stay in one evidence graph.", icon: GitBranch, tone: "cyan" },
  { index: "03", label: "THE EVIDENCE", title: "Keep the source visible.", detail: "Every returned claim retains its source, reference, and entity IDs.", icon: FileSearch, tone: "green" },
  { index: "04", label: "THE UNCERTAINTY", title: "Make uncertainty explicit.", detail: "Risk is an assessment with context, not a theatrical verdict badge.", icon: BrainCircuit, tone: "amber" },
  { index: "05", label: "THE ACTION", title: "Move within policy.", detail: "Recommendations carry their approval route and backend decision state.", icon: ShieldCheck, tone: "red" },
  { index: "06", label: "THE MEMORY", title: "Leave a trace.", detail: "Case writeback and readback remain visible when the backend returns them.", icon: Database, tone: "cyan" },
]

export function LandingStory() {
  return (
    <section className="relative overflow-hidden bg-[var(--ink)] tiger-grid border-t hairline">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow text-[var(--amber)] mb-4">Investigation command center</div>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-.04em] text-[var(--text)] leading-[.95]">
            <BlurText text="Trace the evidence. Not the noise." animateBy="words" delay={80} stepDuration={0.4} />
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)]">A graph-first operating model for decisions that need a relationship, a source, a policy, and a memory.</p>
        </div>

        <div className="grid gap-px bg-white/[.08] md:grid-cols-2 xl:grid-cols-3">
          {chapters.map(({ index, label, title, detail, icon: Icon, tone }, chapterIndex) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: chapterIndex * 0.05, duration: 0.45 }}
              className="group min-h-[230px] bg-[var(--surface)] p-6 transition-colors hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-center justify-between">
                <span className="forensic text-[10px] text-[var(--quiet)]">{index}</span>
                <Icon size={17} className={toneClasses[tone].split(" ")[0]} aria-hidden />
              </div>
              <div className={`mt-8 border-l-2 pl-4 ${toneClasses[tone]}`}>
                <div className="eyebrow text-[var(--quiet)]">{label}</div>
                <h3 className="mt-3 text-xl font-medium text-[var(--text)]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{detail}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-3 forensic text-[9px] tracking-[.16em] text-white/35">
          <ArrowDown size={13} className="text-[var(--amber)]" aria-hidden />
          <span>SELECT A CASE TO ENTER THE LIVE INVESTIGATION WORKSPACE</span>
        </div>
      </div>
    </section>
  )
}
