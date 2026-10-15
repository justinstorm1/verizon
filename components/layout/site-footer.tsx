import Link from "next/link"

import { NAV_ITEMS } from "./nav-items"
import { Container } from "./container"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-mid bg-white">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <p className="text-lg font-extrabold tracking-[-0.03em]">
            Slice<span className="text-brand-red">Live</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Student concept for the NJIT Verizon Smart Campus Competition. All
            data simulated. Not affiliated with Verizon.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Pillar: Next-Gen Products &amp; Services
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  )
}
