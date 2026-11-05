import { Building2, Store, User, Users } from "lucide-react"

import type { PlanId } from "@/lib/config"

export const PLAN_ICONS: Record<PlanId, typeof User> = {
  individual: User,
  family: Users,
  "small-business": Store,
  organization: Building2,
}
