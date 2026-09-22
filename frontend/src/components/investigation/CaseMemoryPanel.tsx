"use client"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { CaseAnswer } from "@/lib/types"

export function CaseMemoryPanel({ answer }: { answer: CaseAnswer }) {
  const written     = answer.memory?.write?.status === "success" || answer.case.written_to_graph
  const graphCaseId = answer.memory?.write?.graph_id || answer.case.graph_case_id
  const memory      = answer.case_memory
  const readback    = answer.memory?.readback?.status === "verified" || memory?.readback === true || answer.grounding?.case_memory_readback === true
  const readbackStatus = answer.memory?.readback?.status ?? (readback ? "verified" : "not_returned")

  const prevWritten = useRef(written)
  const [justWritten, setJustWritten] = useState(false)

  useEffect(() => {
    if (!prevWritten.current && written) {
      setJustWritten(true)
      const t = setTimeout(() => setJustWritten(false), 1800)
      return () => clearTimeout(t)
    }
    prevWritten.current = written
  }, [written])

  return (
    <div className={`rounded-lg border transition-all duration-500 p-3 mt-2 ${
      justWritten
        ? "border-[#D9A441]/60 bg-[#D9A441]/08 glow-amber-pulse"
        : written
          ? "border-[#D9A441]/25 bg-[#D9A441]/04"
          : "border-white/08 bg-[#14151A]/40"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${written ? "bg-[#D9A441]" : "bg-[#8B8D96]/30"}`}
          animate={written ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 1.2, repeat: written ? Infinity : 0, repeatDelay: 3 }}
        />
        <span className={`font-mono-ui text-[9px] tracking-wider uppercase ${
          written ? "text-[#D9A441]" : "text-[#8B8D96]/50"
        }`}>
          {written ? "CASE MEMORY UPDATED" : "MEMORY WRITE PENDING"}
        </span>
      </div>

      <AnimatePresence>
        {written && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-1"
          >
            <div className="font-mono-ui text-[8px] text-[#8B8D96]/50">
              GRAPH ID: <span className="text-[#D9A441]/70">{graphCaseId || "—"}</span>
            </div>
            <div className="font-mono-ui text-[8px] text-[#8B8D96]/50">
              READBACK: <span className={readback ? "text-[#3DD68C]" : "text-[#E8C547]"}>
                {readbackStatus === "verified" ? "VERIFIED" : readbackStatus === "failed" ? "FAILED" : "NOT RETURNED"}
              </span>
            </div>
            {memory && Object.entries(memory)
              .filter(([k]) => !["written","graph_case_id","readback"].includes(k))
              .slice(0, 3)
              .map(([k, v]) => (
                <div key={k} className="font-mono-ui text-[8px] text-[#8B8D96]/40">
                  {k}: {String(v).slice(0, 40)}
                </div>
              ))
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
