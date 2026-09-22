"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BlurTextProps {
  text: string
  className?: string
  animateBy?: "words" | "letters"
  direction?: "top" | "bottom"
  delay?: number
  stepDuration?: number
  once?: boolean
}

export function BlurText({
  text,
  className,
  animateBy = "words",
  direction = "top",
  delay = 120,
  stepDuration = 0.35,
  once = true,
}: BlurTextProps) {
  const [visible, setVisible] = useState(!once)
  const tokens = animateBy === "letters" ? Array.from(text) : text.split(" ")

  useEffect(() => {
    if (!once) return
    const timer = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [once])

  return (
    <span className={cn("inline-flex flex-wrap", className)} aria-label={text}>
      {tokens.map((token, index) => (
        <motion.span
          key={`${token}-${index}`}
          initial={{ opacity: 0, filter: "blur(10px)", y: direction === "top" ? 14 : -14 }}
          animate={visible ? { opacity: 1, filter: "blur(0px)", y: 0 } : undefined}
          transition={{ duration: stepDuration, delay: (index * delay) / 1000, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block whitespace-pre"
        >
          {token}{animateBy === "words" && index < tokens.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </span>
  )
}
