import { Container } from "./container"

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <header className="border-b border-gray-mid bg-white">
      <Container className="flex flex-col gap-6 py-10 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-red">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em] text-balance text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </Container>
    </header>
  )
}
