import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" aria-label="Loading page">
      <div className="border-b border-gray-mid">
        <Container className="py-14">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-12 w-2/3" />
          <Skeleton className="mt-4 h-5 w-1/2" />
        </Container>
      </div>
      <Container className="grid gap-6 py-12 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </Container>
    </div>
  )
}
