"use client"

import { SettingsPageTitle } from "@/components/settings/settings-page-title"
import { SettingsCard } from "@/components/settings/settings-card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const plans = [
  {
    name: "Free Tier",
    price: "$0/month",
    features: ["Up to 10 projects", "Basic task management", "Community support"],
    isCurrent: true,
    cta: "Current Plan",
    disabledCta: true,
  },
  {
    name: "Pro Plan",
    price: "$10/month",
    features: ["Unlimited projects", "Advanced task management", "Priority email support", "Calendar integration"],
    isCurrent: false,
    cta: "Upgrade to Pro",
  },
  {
    name: "Enterprise Plan",
    price: "Contact Us",
    features: ["Everything in Pro", "Dedicated account manager", "Custom integrations", "SLA & advanced security"],
    isCurrent: false,
    cta: "Contact Sales",
  },
]

export default function SubscriptionSettingsPage() {
  const currentPlan = plans.find((plan) => plan.isCurrent)

  const handleChoosePlan = (planName: string) => {
    toast({
      title: "Plan Selected",
      description: `You are about to choose the ${planName}. Follow the next steps to complete.`,
    })
    // In a real app, this would redirect to a checkout page or open a payment modal
  }

  const handleCancelSubscription = () => {
    toast({
      title: "Cancel Subscription",
      description: "Are you sure you want to cancel? This action cannot be undone.",
      variant: "destructive",
      // Add action buttons for confirmation in a real app
    })
  }

  return (
    <div className="space-y-6">
      <SettingsPageTitle title="Subscription" description="Manage your subscription plan and billing details." />

      {currentPlan && (
        <SettingsCard>
          <SettingsCard.Header>
            <SettingsCard.Title>Current Plan: {currentPlan.name}</SettingsCard.Title>
            <SettingsCard.Description>
              Your current subscription is the {currentPlan.name} ({currentPlan.price}). Next billing date: January 1,
              2026. {/* Placeholder date */}
            </SettingsCard.Description>
          </SettingsCard.Header>
          <SettingsCard.Content>
            <ul className="space-y-2">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </SettingsCard.Content>
        </SettingsCard>
      )}

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Available Plans</SettingsCard.Title>
          <SettingsCard.Description>Choose the plan that best suits your needs.</SettingsCard.Description>
        </SettingsCard.Header>
        <SettingsCard.Content className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-lg border ${plan.isCurrent ? "border-primary ring-2 ring-primary" : ""}`}
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold my-2">{plan.price}</p>
              <ul className="space-y-2 mb-4 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => handleChoosePlan(plan.name)} disabled={plan.disabledCta}>
                {plan.cta}
              </Button>
            </div>
          ))}
        </SettingsCard.Content>
      </SettingsCard>

      <SettingsCard>
        <SettingsCard.Header>
          <SettingsCard.Title>Manage Subscription</SettingsCard.Title>
        </SettingsCard.Header>
        <SettingsCard.Content>
          <Button variant="destructive" onClick={handleCancelSubscription}>
            Cancel Subscription
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            If you cancel, your subscription will remain active until the end of the current billing period.
          </p>
        </SettingsCard.Content>
      </SettingsCard>
    </div>
  )
}
