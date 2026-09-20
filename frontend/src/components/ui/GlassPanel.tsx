"use client"
import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  className?: string
  amber?: boolean
  glow?: boolean
}

export function GlassPanel({ children, className, amber, glow }: Props) {
  return (
    <div className={cn(
      "rounded-lg",
      amber ? "glass-amber" : "glass",
      glow && "glow-amber",
      className
    )}>
      {children}
    </div>
  )
}
