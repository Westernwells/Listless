interface SettingsPageTitleProps {
  title: string
  description?: string
}

export function SettingsPageTitle({ title, description }: SettingsPageTitleProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-2">{description}</p>}
    </div>
  )
}
