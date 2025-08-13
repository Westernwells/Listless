import * as React from "react"
import { cn } from "@/lib/utils"

export interface AiSparklesIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

// Flat purple version of Lucide's WandSparkles for better visibility
// Original gradient colors were: #DD31E9 (start) to #9631F1 (end)
export function AiSparklesIcon({ className, ...props }: AiSparklesIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9631F1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("ai-wand", className)}
      aria-hidden="true"
      {...props}
    >
      {/* Main wand body */}
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
      {/* Wand tip detail */}
      <path d="m14 7 3 3" />
      {/* Sparkles - vertical lines */}
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      {/* Sparkles - horizontal lines */}
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  )
}

export default AiSparklesIcon

