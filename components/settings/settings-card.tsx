import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
  CardFooter as ShadcnCardFooter,
} from "@/components/ui/card"

// Main SettingsCard component (wrapper)
const SettingsCardRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <ShadcnCard ref={ref} className={cn("mb-6 w-full", className)} {...props} />,
)
SettingsCardRoot.displayName = "SettingsCard"

// Sub-components
const SettingsCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <ShadcnCardHeader ref={ref} className={cn("", className)} {...props} />,
)
SettingsCardHeader.displayName = "SettingsCard.Header"

const SettingsCardTitle = React.forwardRef<
  HTMLParagraphElement, // Corrected: CardTitle renders a heading element
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  // ShadcnCardTitle typically renders an h3 or similar, so HTMLHeadingElement is more appropriate
  <ShadcnCardTitle ref={ref} className={cn("text-lg", className)} {...props} />
))
SettingsCardTitle.displayName = "SettingsCard.Title"

const SettingsCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <ShadcnCardDescription ref={ref} className={cn("", className)} {...props} />,
)
SettingsCardDescription.displayName = "SettingsCard.Description"

const SettingsCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <ShadcnCardContent ref={ref} className={cn("space-y-4", className)} {...props} />,
)
SettingsCardContent.displayName = "SettingsCard.Content"

const SettingsCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <ShadcnCardFooter ref={ref} className={cn("border-t px-6 py-4", className)} {...props} />
  ),
)
SettingsCardFooter.displayName = "SettingsCard.Footer"

export const SettingsCard = Object.assign(SettingsCardRoot, {
  Header: SettingsCardHeader,
  Title: SettingsCardTitle,
  Description: SettingsCardDescription,
  Content: SettingsCardContent,
  Footer: SettingsCardFooter,
})
